// Public API to create appointment (no permission check)

const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const ManagedUser = require('../models/ManagedUser');
const LogService = require('../services/logService');
const { buildRoleBasedQuery } = require('../middleware/roleBasedFilter');
const crypto = require('crypto');
const axios = require('axios');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    // Admin always has all permissions
    if (user.role === 'admin') return true;
    
    // Doctor role permissions for dashboard access
    if (user.role === 'doctor') {
        // Grant doctors access to appointments, patients, and other resources they need
        if (permission.startsWith('/dashboard/appointments:') || 
            permission.startsWith('/dashboard/patients:') ||
            permission.startsWith('/dashboard/prescriptions:') ||
            permission.startsWith('/dashboard/blood-reports:') ||
            permission.startsWith('/dashboard/profile:')) {
            return true;
        }
    }
    
    // Check specific permissions for other roles
    return user.permissions && user.permissions.includes(permission);
};

exports.getAllAppointments = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            doctorId,
            serviceId,
            startDate,
            endDate,
            showDeleted = false
        } = req.query;

        // Build filter query
        const filter = {};

        // Search filter
        if (search) {
            filter.$or = [
                { patientName: { $regex: search, $options: 'i' } },
                { patientPhone: { $regex: search, $options: 'i' } },
                { doctor: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        if (status && status !== 'All Statuses') {
            filter.status = status;
        }

        // Doctor filter
        if (doctorId && doctorId !== 'All Doctors') {
            filter.doctorId = doctorId;
        }

        // Service filter
        if (serviceId && serviceId !== 'All Services') {
            filter.serviceId = serviceId;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = startDate;
            if (endDate) filter.date.$lte = endDate;
        }

        // Show deleted filter
        if (showDeleted === 'true') {
            filter.deletedAt = { $ne: null };
        } else {
            filter.deletedAt = null;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalCount = await Appointment.countDocuments(filter);

        // Get count by status for filtered results
        const statusCounts = await Appointment.aggregate([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const totalCountByFilter = {
            total: totalCount,
            byStatus: statusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };

        const appointments = await Appointment.find(filter)
            .populate('patientId', 'firstName lastName contact age gender address')
            .populate('serviceId', 'name description price')
            .populate('doctorId', 'name email')
            .populate({
                path: 'referedBy',
                select: 'name email',
                options: { strictPopulate: false }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: appointments,
            totalCountByFilter,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit),
                hasNext: skip + appointments.length < totalCount,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointments' });
    }
};

exports.getAppointmentById = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/appointments:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        // Build query with role-based filtering
        const query = buildRoleBasedQuery(req, { _id: req.params.id });
        
        const appointment = await Appointment.findOne(query);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAppointment = async (req, res) => {
    try {
        // Permission check for admin side
        // if (!req.user || (!hasPermission(req.user, '/dashboard/appointments:create') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }

        const { 
            patientId, 
            serviceId, 
            doctorId, 
            referedBy,
            date, 
            time, 
            status, 
            notes,
            fileUrl,
            // For new patients 
            firstName: patientFirstName,
            lastName: patientLastName,
            contact: patientContact,
            age: patientAge,
            gender: patientGender,
            address: patientAddress,
            type
        } = req.body;

        // Validate required fields
        // if (!doctorId || !serviceId || !date || !time) {
        //     return res.status(400).json({ message: 'doctorId, serviceId, date, and time are required' });
        // }
        
        // Validate date format (YYYY-MM-DD)
        // const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        // if (!dateRegex.test(date)) {
        //     return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD format' });
        // }
        
        // Validate time format (HH:MM)
        // const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        // if (!timeRegex.test(time)) {
        //     return res.status(400).json({ message: 'Invalid time format. Use HH:MM format' });
        // }

        // Check if booking date is in the past
        const bookingDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (bookingDate < today) {
            return res.status(400).json({ message: 'Cannot book appointments for past dates' });
        }
        
        // Verify doctor exists only if doctorId is provided and not empty
        let doctor = null;
        if (doctorId && doctorId.trim() !== '') {
            doctor = await ManagedUser.findById(doctorId);
            if (!doctor || doctor.role !== 'doctor') {
                return res.status(404).json({ message: 'Doctor not found' });
            }
        }
        // const doctor = await ManagedUser.findById(doctorId);
        // if (!doctor || doctor.role !== 'doctor') {
        //     return res.status(404).json({ message: 'Doctor not found' });
        // }

        // Get service info only if serviceId is provided and not empty
        let service = null;
        if (serviceId && serviceId.trim() !== '') {
            service = await Service.findById(serviceId);
            if (!service) {
                return res.status(404).json({ message: 'Selected service not found' });
            }
        }
        // const service = await Service.findById(serviceId);
        // if (!service) {
        //     return res.status(404).json({ message: 'Selected service not found' });
        // }

        // Handle patient - either existing or create new
        let patient;
        let finalPatientId = patientId;
        
        if (patientId) {
            // Verify existing patient
            patient = await Patient.findById(patientId);
            if (!patient) {
                return res.status(404).json({ message: 'Patient not found' });
            }
        } else {
            // Create new patient if required fields are provided
            if (!patientFirstName || !patientLastName || !patientContact) {
                return res.status(400).json({ message: 'Patient first name, last name, and contact are required for new bookings.' });
            }
            
            // Check if patient with exact match exists
            patient = await Patient.findOne({ 
                firstName: patientFirstName, 
                lastName: patientLastName, 
                contact: patientContact 
            });
            
            if (patient) {
                finalPatientId = patient._id;
                const updates = {};
                updates.fileUrl = fileUrl;
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
                    lastName: patientLastName,
                    contact: patientContact,
                    fileUrl: fileUrl,
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
        
        // Create the appointment
        const newAppointmentData = {
            patientId: finalPatientId,
            referedBy,
            fileUrl,    
            service: service?.name || '',
            doctor: doctor?.name || '',
            date,
            time,
            status: status || 'Pending',
            notes: notes || '',
            patientName: `${patient.firstName} ${patient.lastName || ''}`.trim(),
            patientEmail: patient.email || '',
            patientEmail: patient.email || '',
            patientPhone: patient.contact,
            type: type || 'offline'
        };

        // If online appointment, generate meeting link
        if (type === 'online') {
            const linkId = crypto.randomBytes(8).toString('hex'); // 16 chars hex
            const channel = `consult_${linkId}`;
            newAppointmentData.meeting = {
                linkId,
                channel,
                status: 'scheduled',
                expiresAt: new Date(new Date(`${date}T${time}`).getTime() + 60 * 60 * 1000) // Default 1 hr duration
            };
        }
        
        // Only add serviceId if it exists and is not empty
        if (serviceId && serviceId.trim() !== '') {
            newAppointmentData.serviceId = serviceId;
        }
        
        // Only add doctorId if it exists and is not empty
        if (doctorId && doctorId.trim() !== '') {
            newAppointmentData.doctorId = doctorId;
        }

        const createdAppointment = await Appointment.create(newAppointmentData);

        // WhatsApp notifications (only for online appointments)
        if (type === 'online') {
            const cleanDoctorName = doctor?.name || "Doctor";
            const cleanPatientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
            const cleanDate = new Date(date).toLocaleDateString();
            const cleanTime = time;
            const meetingLink = `https://app.clinicpro.com/meeting/${createdAppointment.meeting?.linkId}`;

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
                        details: { phoneNumber: patient.contact, recipient: 'patient', appointmentId: createdAppointment._id },
                        request: req
                    });
                }
            }

            // Send to doctor
            if (doctor?.contact) {
                const doctorResult = await sendWhatsApp(doctor.contact, "consultation_dr", [
                    cleanPatientName,
                    cleanTime,
                    cleanDate
                ]);
                
                if (doctorResult.success) {
                    await LogService.logActivity({
                        actor: req.user || { _id: 'public', name: 'Public User' },
                        action: 'SEND_APPOINTMENT_WHATSAPP',
                        entity: { type: 'AppointmentNotification', name: 'Sent to doctor' },
                        details: { phoneNumber: doctor.contact, recipient: 'doctor', appointmentId: createdAppointment._id },
                        request: req
                    });
                }
            }
        }

        await LogService.logActivity({
            actor: req.user,
            action: 'CREATE_APPOINTMENT',
            entity: {
                type: 'Appointment',
                id: createdAppointment._id.toString(),
                name: `${doctor.name}`
            },
            details: {
                appointment: createdAppointment.toObject(),
                patientId: finalPatientId,
                patientName: `${patient.firstName} ${patient.lastName || ''}`.trim(),
            },
            request: req
        });

        res.status(201).json(createdAppointment);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(400).json({ message: error.message });
    }
};



// Get filter options for dropdowns
exports.getFilterOptions = async (req, res) => {
    try {
        const [doctors, services, statuses] = await Promise.all([
            ManagedUser.find({ role: 'doctor' }, 'name').sort({ name: 1 }),
            Service.find({}, 'name').sort({ name: 1 }),
            Appointment.distinct('status')
        ]);

        res.json({
            success: true,
            data: {
                doctors,
                services,
                statuses
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching filter options' });
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/appointments:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id } = req.params;
        const body = req.body;
        const allowedUpdates = {};
        if (body.type) allowedUpdates.type = body.type;
        if (body.serviceId) allowedUpdates.serviceId = body.serviceId;
        if (body.doctorId) allowedUpdates.doctorId = body.doctorId;
        if (body.date) allowedUpdates.date = body.date;
        if (body.time) allowedUpdates.time = body.time;
        if (body.status) allowedUpdates.status = body.status;
        if (body.notes !== undefined) allowedUpdates.notes = body.notes;
        if (body.serviceId) {
            const service = await Service.findById(body.serviceId);
            if (service) allowedUpdates.service = service.name;
        }
        if (body.doctorId) {
            const doctor = await ManagedUser.findById(body.doctorId);
            if (doctor) allowedUpdates.doctor = doctor.name;
        }

        // Handle type change to online - generate meeting link if needed
        if (body.type === 'online') {
            const existingAppointment = await Appointment.findById(id);
            if (existingAppointment && (!existingAppointment.meeting || !existingAppointment.meeting.linkId)) {
                const linkId = crypto.randomBytes(8).toString('hex');
                const channel = `consult_${linkId}`;
                // Use new date/time if provided, otherwise existing
                const appDate = body.date || existingAppointment.date;
                const appTime = body.time || existingAppointment.time;
                
                allowedUpdates.meeting = {
                    linkId,
                    channel,
                    status: 'scheduled',
                    expiresAt: new Date(new Date(`${appDate}T${appTime}`).getTime() + 60 * 60 * 1000)
                };
            }
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            allowedUpdates,
            { new: true, runValidators: true }
        );
        if (!updatedAppointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        const patient = await Patient.findById(updatedAppointment.patientId);
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_APPOINTMENT',
            entity: {
                type: 'Appointment',
                id: updatedAppointment._id.toString(),
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                changes: allowedUpdates
            },
            request: req
        });
        res.json(updatedAppointment);
    } catch (error) {
        res.status(400).json({ message: 'Error updating appointment' });
    }
};

exports.softDeleteAppointment = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/appointments:delete') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id } = req.params;
        const appointmentToSoftDelete = await Appointment.findById(id);
        if (!appointmentToSoftDelete) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        const patient = await Patient.findById(appointmentToSoftDelete.patientId);
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );
        if (!updatedAppointment) {
            return res.status(500).json({ message: 'Failed to delete appointment' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'SOFT_DELETE_APPOINTMENT',
            entity: {
                type: 'Appointment',
                id: id,
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                deletedAppointment: updatedAppointment.toObject()
            },
            request: req
        });
        res.json(updatedAppointment);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting appointment' });
    }
};

exports.restoreAppointment = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/appointments:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id } = req.params;
        const appointmentToRestore = await Appointment.findById(id);
        if (!appointmentToRestore) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        const restoredAppointment = await Appointment.findByIdAndUpdate(
            id,
            { $unset: { deletedAt: 1 } },
            { new: true }
        );
        if (!restoredAppointment) {
            return res.status(500).json({ message: 'Failed to restore appointment' });
        }
        const patient = await Patient.findById(restoredAppointment.patientId);
        await LogService.logActivity({
            actor: req.user,
            action: 'RESTORE_APPOINTMENT',
            entity: {
                type: 'Appointment',
                id: id,
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                restoredAppointment: restoredAppointment.toObject()
            },
            request: req
        });
        res.json(restoredAppointment);
    } catch (error) {
        res.status(500).json({ message: 'Error restoring appointment' });
    }
};

exports.permanentDeleteAppointment = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: Admins only' });
        }
        const { id } = req.params;
        const appointmentToDelete = await Appointment.findById(id);
        if (!appointmentToDelete) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        const patient = await Patient.findById(appointmentToDelete.patientId);
        const deletedAppointment = await Appointment.findByIdAndDelete(id);
        if (!deletedAppointment) {
            return res.status(404).json({ message: 'Appointment not found during deletion' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'PERMANENT_DELETE_APPOINTMENT',
            entity: {
                type: 'Appointment',
                id: id,
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                deletedAppointment: appointmentToDelete.toObject()
            },
            request: req
        });
        res.status(204).json({ message: 'Appointment permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error permanently deleting appointment' });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/appointments:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        const patient = await Patient.findById(appointment.patientId);
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_APPOINTMENT_STATUS',
            entity: {
                type: 'Appointment',
                id: appointment._id.toString(),
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                newStatus: status,
                previousStatus: appointment.status
            },
            request: req
        });
        res.json(appointment);
    } catch (error) {
        res.status(400).json({ message: 'Error updating appointment status' });
    }
};










exports.getMeetingByLink = async (req, res) => {
    try {
        const { linkId } = req.params;
        const appointment = await Appointment.findOne({ 'meeting.linkId': linkId });

        if (!appointment) {
            return res.status(404).json({ message: 'Invalid or expired meeting link' });
        }

        // Check if meeting is valid (not cancelled/completed/expired)
        // This logic can be expanded based on requirements
        
        res.json({
            success: true,
            data: {
                appointmentId: appointment._id,
                doctorName: appointment.doctor,
                patientName: appointment.patientName,
                startTime: appointment.meeting.startedAt,
                status: appointment.meeting.status,
                roomId: appointment.meeting.linkId
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying meeting link' });
    }
};
