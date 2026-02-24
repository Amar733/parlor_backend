// Public API to create appointment (no permission check)

const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const ManagedUser = require('../models/ManagedUser');
const LogService = require('../services/logService');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

exports.getAllAppointments = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/appointments:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const appointments = await Appointment.find();
        const mappedAppointments = appointments.map(appointment => {
            const appointmentObj = appointment.toObject();
            appointmentObj.id = appointmentObj._id;
            return appointmentObj;
        });
        res.json(mappedAppointments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointments' });
    }
};

exports.getAppointmentById = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/appointments:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        const appointmentObj = appointment.toObject();
        appointmentObj.id = appointmentObj._id;
        res.json(appointmentObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAppointment = async (req, res) => {
    try {
        // Permission check for admin side
        if (!req.user || (!hasPermission(req.user, '/dashboard/appointments:create') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { 
            patientId, 
            serviceId, 
            doctorId, 
            date, 
            time, 
            status, 
            notes,
            // For new patients 
            firstName: patientFirstName,
            lastName: patientLastName,
            contact: patientContact,
            age: patientAge,
            gender: patientGender,
            address: patientAddress
        } = req.body;

        // Validate required fields
        if (!doctorId || !serviceId || !date || !time) {
            return res.status(400).json({ message: 'doctorId, serviceId, date, and time are required' });
        }
        
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD format' });
        }
        
        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            return res.status(400).json({ message: 'Invalid time format. Use HH:MM format' });
        }

        // Check if booking date is in the past
        const bookingDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (bookingDate < today) {
            return res.status(400).json({ message: 'Cannot book appointments for past dates' });
        }
        
        // Verify doctor exists
        const doctor = await ManagedUser.findById(doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Get service info
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Selected service not found' });
        }

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
            serviceId,
            doctorId,
            service: service.name,
            doctor: doctor.name,
            date,
            time,
            status: status || 'Pending',
            notes: notes || '',
            patientName: `${patient.firstName} ${patient.lastName || ''}`.trim(),
            patientEmail: patient.email || '',
            patientPhone: patient.contact
        };

        const createdAppointment = await Appointment.create(newAppointmentData);

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

        const createdAppointmentObj = createdAppointment.toObject();
        createdAppointmentObj.id = createdAppointmentObj._id;
        res.status(201).json(createdAppointmentObj);
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(400).json({ message: error.message });
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
        const updatedAppointmentObj = updatedAppointment.toObject();
        updatedAppointmentObj.id = updatedAppointmentObj._id;
        res.json(updatedAppointmentObj);
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
        const updatedAppointmentObj = updatedAppointment.toObject();
        updatedAppointmentObj.id = updatedAppointmentObj._id;
        res.json(updatedAppointmentObj);
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
        const restoredAppointmentObj = restoredAppointment.toObject();
        restoredAppointmentObj.id = restoredAppointmentObj._id;
        res.json(restoredAppointmentObj);
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
        const appointmentObj = appointment.toObject();
        appointmentObj.id = appointmentObj._id;
        res.json(appointmentObj);
    } catch (error) {
        res.status(400).json({ message: 'Error updating appointment status' });
    }
};
