const { RtcTokenBuilder, RtcRole } = require("agora-token");
const Appointment = require("../models/Appointment");

exports.generateToken = async (req, res) => {
  try {
    const { channelName, uid } = req.body;

    if (!channelName) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    // Verify Meeting Status
    const appointment = await Appointment.findOne({ 'meeting.linkId': channelName });
    if (!appointment) {
        return res.status(404).json({ message: "Meeting not found" });
    }
    
    if (appointment.meeting.status === 'completed' || appointment.meeting.status === 'cancelled') {
        return res.status(403).json({ message: "This meeting has ended." });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return res.status(500).json({ message: "Agora configuration missing" });
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const userUid = uid || 0;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      userUid,
      role,
      privilegeExpiredTs
    );

    res.json({ token, uid: userUid });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    res.status(500).json({ message: "Failed to generate token" });
  }
};
