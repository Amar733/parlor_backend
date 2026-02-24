const ManagedUser = require('../models/ManagedUser');
const Appointment = require('../models/Appointment');
const TimeSlot = require('../models/TimeSlot');
const Patient = require('../models/Patient');
const LogService = require('../services/logService');
const crypto = require('crypto');
const axios = require('axios');

// Helper function to get day name from date
const getDayFromDate = (date) => {
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const dayMap = {
        'sun': 'sunday',
        'mon': 'monday',
        'tue': 'tuesday',
        'wed': 'wednesday',
        'thu': 'thursday',
        'fri': 'friday',
        'sat': 'saturday'
    };
    return dayMap[dayName] || 'monday';
};

// Helper function to check slot availability
const checkSlotAvailability = async (doctorId, date, time) => {
    try {
        // Get the day name from date
        const dayName = getDayFromDate(date);

        // 1. Check if doctor has this time slot available for this day
        const doctorTimeSlots = await TimeSlot.findOne({ userId: doctorId, isMaster: false });

        if (!doctorTimeSlots) {
            return {
                available: false,
                reason: 'Doctor has no time slots configured',
                capacity: 0,
                booked: 0
            };
        }

        const daySlots = doctorTimeSlots.slots[dayName] || [];
        if (!daySlots.includes(time)) {
            return {
                available: false,
                reason: 'Doctor is not available at this time on this day',
                capacity: 0,
                booked: 0
            };
        }

        // 2. Get doctor's capacity per slot
        const capacity = doctorTimeSlots.patientsPerSlot || 1;

        // 3. Count existing appointments for this slot
        const bookedCount = await Appointment.countDocuments({
            doctorId,
            date,
            time,
            status: { $ne: 'Cancelled' }
        });

        // 4. Check availability
        const isAvailable = bookedCount < capacity;

        return {
            available: isAvailable,
            reason: isAvailable ? 'Slot available' : 'This time slot is fully booked',
            capacity,
            booked: bookedCount,
            remaining: capacity - bookedCount
        };

    } catch (error) {
        console.error('Error checking slot availability:', error);
        return {
            available: false,
            reason: 'Error checking availability',
            capacity: 0,
            booked: 0
        };
    }
};

// Check availability for a specific slot
exports.checkSlotAvailability = async (req, res) => {
    try {
        const { doctorId, date, time } = req.query;

        // Validate required parameters
        if (!doctorId || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'doctorId, date, and time are required query parameters'
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD format (e.g., 2025-08-03)'
            });
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format. Use HH:MM format (e.g., 10:00)'
            });
        }

        // Verify doctor exists
        const doctor = await ManagedUser.findById(doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Check availability
        const availability = await checkSlotAvailability(doctorId, date, time);

        res.json({
            success: true,
            data: {
                doctorId,
                doctorName: doctor.name,
                date,
                time,
                availability: {
                    available: availability.available,
                    reason: availability.reason,
                    capacity: availability.capacity,
                    booked: availability.booked,
                    remaining: availability.remaining
                }
            }
        });

    } catch (error) {
        console.error('Error in checkSlotAvailability:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking slot availability'
        });
    }
};

// Book an appointment with capacity validation
exports.bookAppointment = async (req, res) => {
    try {
        const {
            patientId,
            referedBy,
            doctorId,
            serviceId,
            service,
            date,
            time,
            notes,
            fileUrl,
            // For new patients
            patientFirstName,
            patientLastName,
            patientContact,
            patientAge,
            patientGender,
            patientAddress,
            type
        } = req.body;

        // Verify doctor exists only if doctorId is provided and not empty
        let doctor = null;
        if (doctorId && doctorId.trim() !== '') {
            doctor = await ManagedUser.findById(doctorId);
            if (!doctor || doctor.role !== 'doctor') {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor not found'
                });
            }
        }

        // Check slot availability
        // const availability = await checkSlotAvailability(doctorId, date, time);

        // if (!availability.available) {
        //     return res.status(409).json({
        //         success: false,
        //         message: availability.reason,
        //         data: {
        //             capacity: availability.capacity,
        //             booked: availability.booked,
        //             remaining: availability.remaining
        //         }
        //     });
        // }

        // Handle patient - either existing or create new
        let patient;
        let finalPatientId = patientId;

        if (patientId) {
            // Verify existing patient
            patient = await Patient.findById(patientId);
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found'
                });
            }
        } else {
            // Create new patient if required fields are provided
            if (!patientFirstName || !patientContact) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient first name, and contact are required for new bookings.'
                });
            }

            // Check if patient with exact match exists
            patient = await Patient.findOne({
                firstName: patientFirstName,
                lastName: patientLastName || "",
                contact: patientContact
            });

            if (patient) {
                finalPatientId = patient._id;
                const updates = {};
                updates.fileUrl = fileUrl || '';
                if (patient.age !== patientAge) updates.age = patientAge;
                if (patient.gender !== patientGender) updates.gender = patientGender;
                if (patient.address !== patientAddress) updates.address = patientAddress;
                if (Object.keys(updates).length > 0) {
                    await Patient.findByIdAndUpdate(patient._id, updates);
                    patient = await Patient.findById(patient._id); // Get updated patient data
                }
            } else {
                const existingPatientsWithContact = await Patient.find({ contact: patientContact });
                const isFirstForNumber = existingPatientsWithContact.length === 0;
                const newPatientData = {
                    firstName: patientFirstName,
                    fileUrl: fileUrl || '',
                    lastName: patientLastName,
                    contact: patientContact,
                    age: patientAge,
                    gender: patientGender,
                    address: patientAddress || '',
                    is_primary: isFirstForNumber,
                    associated_with_mobile: !isFirstForNumber,
                };
                const newPatient = await Patient.create(newPatientData);
                patient = newPatient;
                finalPatientId = newPatient._id;
                if (existingPatientsWithContact.length === 1) {
                    await Patient.findByIdAndUpdate(existingPatientsWithContact[0]._id, { associated_with_mobile: true });
                }
            }
        }

        // Double-check availability right before booking (race condition protection)
        // const finalAvailability = await checkSlotAvailability(doctorId, date, time);
        // if (!finalAvailability.available) {
        //     return res.status(409).json({
        //         success: false,
        //         message: 'Slot became unavailable during booking process. Please try another time slot.',
        //         data: {
        //             capacity: finalAvailability.capacity,
        //             booked: finalAvailability.booked,
        //             remaining: finalAvailability.remaining
        //         }
        //     });
        // }

        // Create the appointment
        const appointmentData = {
            patientId: finalPatientId,
            referedBy,
            serviceId: serviceId || null,
            fileUrl: fileUrl || '',
            service,
            doctor: doctor?.name || '',
            date,
            time,
            status: 'Confirmed',
            notes: notes || '',
            patientName: `${patient.firstName} ${patient.lastName || ''}`.trim(),
            patientEmail: patient.email || '',
            patientPhone: patient.contact,
            type: type || 'offline'
        };
        if (type === 'online') {
            const linkId = crypto.randomBytes(8).toString('hex'); // 16 chars hex
            const channel = `consult_${linkId}`;
            appointmentData.meeting = {
                linkId,
                channel,
                status: 'scheduled',
                expiresAt: new Date(new Date(`${date}T${time}`).getTime() + 60 * 60 * 1000) // Default 1 hr duration
            };
        }

        // Only add doctorId if it exists and is not empty
        if (doctorId && doctorId.trim() !== '') {
            appointmentData.doctorId = doctorId;
        }

        const appointment = await Appointment.create(appointmentData);

        // WhatsApp notifications (only for online appointments)
        if (type === 'online') {
            const cleanDoctorName = doctor?.name || "Doctor";
            const cleanPatientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
            const cleanDate = new Date(date).toLocaleDateString();
            const cleanTime = time;
            const meetingLink = `${'https://app.clinicpro.com'}/meeting/${appointment.meeting?.linkId}`;

            const sendWhatsApp = async (phoneNumber, templateName, bodyValues) => {
                try {
                    // Clean and validate phone number
                    let cleanNumber = phoneNumber.toString().replace(/[^0-9]/g, '');
                    
                    // Remove country code if present
                    if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
                        cleanNumber = cleanNumber.substring(2);
                    }
                    
                    // Ensure it's exactly 10 digits
                    if (cleanNumber.length !== 10) {
                        console.error('Invalid phone number length:', phoneNumber);
                        return { success: false, error: 'Invalid phone number format' };
                    }

                    const response = await axios.post('https://api.interakt.ai/v1/public/message/', {
                        countryCode: "+91",
                        phoneNumber: cleanNumber,
                        type: "Template",
                        template: {
                            name: templateName,
                            languageCode: "en",
                            bodyValues: bodyValues
                        }
                    }, {
                        headers: {
                            'Authorization': `Basic ${process.env.INTERAKT_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    return { success: true, data: response.data };
                } catch (error) {
                    console.error('WhatsApp API error:', error.response?.data || error.message);
                    return { success: false, error: error.response?.data || error.message };
                }
            };

            // Send to patient
            if (patient.contact) {
                const patientResult = await sendWhatsApp(patient.contact, "dp_booking_1_wa", [
                    cleanDoctorName,
                    cleanTime,
                    cleanDate,
                    meetingLink
                ]);
                
                if (patientResult.success) {
                    await LogService.logActivity({
                        actor: req.user || { _id: 'public', name: 'Public User' },
                        action: 'SEND_APPOINTMENT_WHATSAPP',
                        entity: { type: 'AppointmentNotification', name: 'Sent to patient' },
                        details: { phoneNumber: patient.contact, recipient: 'patient', appointmentId: appointment._id },
                        request: req
                    });
                }
            }

            // Send to doctor
            if (doctor?.phone) {
                const doctorResult = await sendWhatsApp(doctor.phone, "consultation_dr", [
                    cleanPatientName,
                    cleanTime,
                    cleanDate
                ]);
                
                if (doctorResult.success) {
                    await LogService.logActivity({
                        actor: req.user || { _id: 'public', name: 'Public User' },
                        action: 'SEND_APPOINTMENT_WHATSAPP',
                        entity: { type: 'AppointmentNotification', name: 'Sent to doctor' },
                        details: { phoneNumber: doctor.phone, recipient: 'doctor', appointmentId: appointment._id },
                        request: req
                    });
                }
            }
        }

        // Log the activity
        await LogService.logActivity({
            actor: req.user || { _id: 'public', name: 'Public User' },
            action: 'CREATE_APPOINTMENT',
            entity: {
                type: 'Appointment',
                id: appointment._id.toString(),
                name: `Appointment for ${patient.name}`
            },
            details: {
                // doctorId,
                // doctorName: doctor.name,
                patientId: finalPatientId,
                patientName: patient.name,
                service,
                date,
                time,
                status: 'Confirmed',
                // slotCapacity: finalAvailability.capacity,
                // slotBookedAfter: finalAvailability.booked + 1
            },
            request: req
        });

        // Get updated availability after booking
        // const updatedAvailability = await checkSlotAvailability(doctorId, date, time);

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: {
                appointment: {
                    id: appointment._id,
                    patientId: finalPatientId,
                    patientName: `${patient.firstName} ${patient.lastName || ''}`.trim(),
                    // doctorId,
                    referedBy,
                    // doctorName: doctor.name,
                    service,
                    date,
                    time,
                    status: appointment.status,
                    notes: appointment.notes
                },
                // slotInfo: {
                //     capacity: updatedAvailability.capacity,
                //     booked: updatedAvailability.booked,
                //     remaining: updatedAvailability.remaining
                // }
            }
        });

    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error booking appointment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all appointments for a specific slot (for admin/doctor view)
exports.getSlotAppointments = async (req, res) => {
    try {
        const { doctorId, date, time } = req.query;

        if (!doctorId || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'doctorId, date, and time are required query parameters'
            });
        }

        // Verify doctor exists
        const doctor = await ManagedUser.findById(doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Get all appointments for this slot
        const appointments = await Appointment.find({
            doctorId,
            date,
            time,
            status: { $ne: 'Cancelled' }
        }).sort({ createdAt: 1 });

        // Get slot capacity info
        const availability = await checkSlotAvailability(doctorId, date, time);

        res.json({
            success: true,
            data: {
                doctorId,
                doctorName: doctor.name,
                date,
                time,
                capacity: availability.capacity,
                booked: availability.booked,
                remaining: availability.remaining,
                appointments: appointments.map(apt => ({
                    id: apt._id,
                    patientName: apt.patientName,
                    patientEmail: apt.patientEmail,
                    patientPhone: apt.patientPhone,
                    service: apt.service,
                    status: apt.status,
                    notes: apt.notes,
                    bookedAt: apt.createdAt
                }))
            }
        });

    } catch (error) {
        console.error('Error getting slot appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving slot appointments'
        });
    }
};

// Cancel an appointment and free up the slot
exports.cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { reason } = req.body;

        // Find the appointment
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (appointment.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Appointment is already cancelled'
            });
        }

        // Update appointment status
        appointment.status = 'Cancelled';
        appointment.notes = appointment.notes + (reason ? `\nCancellation reason: ${reason}` : '\nCancelled');
        await appointment.save();

        // Get updated availability after cancellation
        const availability = await checkSlotAvailability(appointment.doctorId, appointment.date, appointment.time);

        // Log the activity
        await LogService.logActivity({
            actor: req.user || { _id: 'public', name: 'Public User' },
            action: 'CANCEL_APPOINTMENT',
            entity: {
                type: 'Appointment',
                id: appointment._id.toString(),
                name: `Appointment for ${appointment.patientName}`
            },
            details: {
                doctorId: appointment.doctorId,
                patientName: appointment.patientName,
                service: appointment.service,
                date: appointment.date,
                time: appointment.time,
                reason: reason || 'No reason provided',
                slotCapacity: availability.capacity,
                slotBookedAfter: availability.booked
            },
            request: req
        });

        res.json({
            success: true,
            message: 'Appointment cancelled successfully',
            data: {
                appointmentId: appointment._id,
                status: appointment.status,
                slotInfo: {
                    capacity: availability.capacity,
                    booked: availability.booked,
                    remaining: availability.remaining
                }
            }
        });

    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling appointment'
        });
    }
};

module.exports = exports;
