const { Server } = require("socket.io");
const Appointment = require("../models/Appointment");

const meetingSocket = (io) => {
  const meetingNamespace = io.of("/meeting");

  // Store active room state including timeouts
  // Structure: { [linkId]: { doctor: boolean, patient: boolean, startTime: Date | null, timeout: TimeoutID | null } }
  const activeRooms = {};

  // Helper to handle meeting end logic (DB update + Cleanup)
  const endMeeting = async (linkId, endedByUserId = 'system') => {
    console.log(`Ending meeting ${linkId} (Triggered by: ${endedByUserId})`);
    
    // Clear in-memory state
    if (activeRooms[linkId]) {
      if (activeRooms[linkId].timeout) clearTimeout(activeRooms[linkId].timeout);
      delete activeRooms[linkId];
    }

    // Notify users (if any still connected, though mostly for "meeting ended" screen)
    meetingNamespace.to(linkId).emit("meeting-ended", { endedBy: endedByUserId });

    // Update DB
    try {
      const appointment = await Appointment.findOne({ 'meeting.linkId': linkId });
      if (appointment) {
        if (appointment.meeting.status === 'ongoing' || appointment.meeting.status === 'scheduled') {
             appointment.meeting.status = 'completed';
             appointment.meeting.endedAt = new Date();
             
             // Calculate duration
             if (appointment.meeting.startedAt) {
                const durationMs = new Date().getTime() - new Date(appointment.meeting.startedAt).getTime();
                appointment.meeting.duration = Math.floor(durationMs / 1000 / 60); 
             }
             await appointment.save();
             console.log(`Meeting ${linkId} marked completed. Duration: ${appointment.meeting.duration} min`);
        }
      }
    } catch (err) {
      console.error("Error ending meeting DB:", err);
    }
  };

  meetingNamespace.on("connection", (socket) => {
    console.log("New client connected to meeting namespace:", socket.id);

    // Join Room
    socket.on("join-room", async (data) => {
      const { linkId, userType } = data; // userType: 'doctor' | 'patient'

      // Check DB Status first
      let appt;
      try {
        appt = await Appointment.findOne({ 'meeting.linkId': linkId });
        if (!appt) {
             // socket.emit("error", { message: "Meeting not found" });
             // better to just fail silently or emit ended
             socket.emit("meeting-ended", { endedBy: 'invalid' });
             return;
        }
        if (appt.meeting.status === 'completed' || appt.meeting.status === 'cancelled') {
             console.log(`Rejected join for ${linkId}: Meeting is ${appt.meeting.status}`);
             socket.emit("meeting-ended", { endedBy: 'expired' });
             return;
        }
      } catch (err) {
         console.error("Error verifying meeting status:", err);
         return; 
      }

      socket.join(linkId);
      
      // Initialize if needed
      if (!activeRooms[linkId]) {
        activeRooms[linkId] = { doctor: false, patient: false, startTime: null, timeout: null };
        
        // Restore timer if ongoing
        if (appt.meeting.status === 'ongoing' && appt.meeting.startedAt) {
             activeRooms[linkId].startTime = appt.meeting.startedAt;
        }
      }

      // Clear any pending disconnect timeout since someone joined
      if (activeRooms[linkId].timeout) {
          console.log(`Meeting ${linkId}: Timeout cleared (User rejoined)`);
          clearTimeout(activeRooms[linkId].timeout);
          activeRooms[linkId].timeout = null;
      }

      // Update participant status
      if (userType === 'doctor') activeRooms[linkId].doctor = true;
      else activeRooms[linkId].patient = true;

      const roomState = activeRooms[linkId];
      const isReady = roomState.doctor && roomState.patient;
      const waitingFor = !roomState.doctor ? 'doctor' : (!roomState.patient ? 'patient' : null);

      socket.meetingData = { linkId, userType };

      // Emit status
      meetingNamespace.to(linkId).emit("room-status", {
        status: isReady ? 'ready' : 'waiting',
        waitingFor,
        startTime: roomState.startTime
      });
      
      console.log(`User ${userType} joined room ${linkId}.`);
    });

    // Start meeting
    socket.on("start-meeting", async (data) => {
      const { linkId, userId } = data;
      
      if (!activeRooms[linkId]) return;

      // Only set start time if NOT set (Protect existing timer)
      if (!activeRooms[linkId].startTime) {
          console.log(`Meeting ${linkId} sending start signal.`);
          const startTime = new Date();
          activeRooms[linkId].startTime = startTime;

          // Update DB
          try {
               const appointment = await Appointment.findOne({ 'meeting.linkId': linkId });
               if (appointment && appointment.meeting.status === 'scheduled') {
                 appointment.meeting.status = 'ongoing';
                 appointment.meeting.startedAt = startTime;
                 await appointment.save();
               }
          } catch (err) { console.error(err); }
      } else {
          console.log(`Meeting ${linkId} already started. Syncing time.`);
      }

      // Broadcast the (new or existing) start time
      meetingNamespace.to(linkId).emit("meeting-started", { 
          startedBy: userId, 
          startTime: activeRooms[linkId].startTime 
      });
    });

    // Explicit End
    socket.on("end-meeting", async (data) => {
      const { linkId, userId } = data;
      await endMeeting(linkId, userId);
    });

    // Sync Media Status
    socket.on("toggle-audio", (data) => {
      const { linkId, userId, muted } = data;
      socket.to(linkId).emit("user-audio-status", { userId, muted });
    });

    socket.on("toggle-video", (data) => {
      const { linkId, userId, videoOff } = data;
      socket.to(linkId).emit("user-video-status", { userId, videoOff });
    });

    // Chat
    socket.on("send-message", (data) => {
        const { roomId, message, sender } = data;
        socket.to(roomId).emit("receive-message", { message, sender, timestamp: new Date() });
    });

    // Disconnect Handling
    socket.on("disconnect", () => {
      if (socket.meetingData) {
          const { linkId, userType } = socket.meetingData;
          
          if (activeRooms[linkId]) {
              // Update flags
              if (userType === 'doctor') activeRooms[linkId].doctor = false;
              else activeRooms[linkId].patient = false;

              // Emit updated status
              const roomState = activeRooms[linkId];
              
              // Check if room is effectively empty
              // (Note: simple boolean check might flake if multiple tabs open same user type, 
              // but for this MVP assuming 1 session per user type is okay or acceptable risk.
              // A counter would be better but requires more state tracking.)
              
              // If everyone left, start timeout
              if (!activeRooms[linkId].doctor && !activeRooms[linkId].patient) {
                  console.log(`Room ${linkId} is empty. Starting 5-minute timeout cleanup.`);
                  activeRooms[linkId].timeout = setTimeout(() => {
                      if (activeRooms[linkId] && !activeRooms[linkId].doctor && !activeRooms[linkId].patient) {
                          console.log(`Timeout reached for ${linkId}. Auto-ending meeting.`);
                          endMeeting(linkId, 'system-timeout');
                      }
                  }, 5 * 60 * 1000); // 5 minutes
              }

              // Update others
              const waitingFor = !activeRooms[linkId].doctor ? 'doctor' : (!activeRooms[linkId].patient ? 'patient' : null);
              meetingNamespace.to(linkId).emit("room-status", {
                  status: 'waiting',
                  waitingFor,
                  startTime: roomState.startTime
              });
          }
      }
    });
  });
};

module.exports = meetingSocket;
