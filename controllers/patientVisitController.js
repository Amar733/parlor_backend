// Public API to create patient visit (no permission check)

const PatientVisit = require('../models/PatientVisit');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const ManagedUser = require('../models/ManagedUser');
const LogService = require('../services/logService');
const { buildRoleBasedQuery } = require('../middleware/roleBasedFilter');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    // Admin always has all permissions
    if (user.role === 'admin') return true;
    
    // Doctor role permissions for dashboard access
    if (user.role === 'doctor') {
        // Grant doctors access to patient visits, patients, and other resources they need
        if (permission.startsWith('/dashboard/patient-visits:') || 
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

exports.getAllPatientVisits = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:read') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }
        
        // Build query with role-based filtering
        const query = buildRoleBasedQuery(req, {});
        
        const patientVisits = await PatientVisit.find(query)
            .populate('patientId', 'firstName lastName contact age gender address')
            .populate('serviceId', 'name description price')
            .populate('doctorId', 'name email')
            .populate('referedBy', 'name email')
            .sort({ createdAt: -1 });
            
        res.json(patientVisits);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patient visits' });
    }
};

exports.getPatientVisitById = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        // Build query with role-based filtering
        const query = buildRoleBasedQuery(req, { _id: req.params.id });
        
        const patientVisit = await PatientVisit.findOne(query);
        if (!patientVisit) {
            return res.status(404).json({ message: 'Patient visit not found' });
        }
        res.json(patientVisit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPatientVisit = async (req, res) => {
    try {
        // Permission check for admin side
        // if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:create') && req.user.role !== 'admin')) {
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
            address: patientAddress
        } = req.body;

        // Validate required fields
        // if (!doctorId || !serviceId || !date || !time) {
        //     return res.status(400).json({ message: 'doctorId, serviceId, date, and time are required' });
        // }
        
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

        // Check if visit date is in the past
        const visitDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (visitDate < today) {
            return res.status(400).json({ message: 'Cannot book patient visits for past dates' });
        }
        
        // Verify doctor exists
        const doctor = await ManagedUser.findById(doctorId);
        // if (!doctor || doctor.role !== 'doctor') {
        //     return res.status(404).json({ message: 'Doctor not found' });
        // }

        // // Get service info
        const service = await Service.findById(serviceId);
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
                return res.status(400).json({ message: 'Patient first name, last name, and contact are required for new visits.' });
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
        
        // Create the patient visit
        const newPatientVisitData = {
            patientId: finalPatientId,
            serviceId,
            referedBy,
            doctorId,
            fileUrl,    
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

        const createdPatientVisit = await PatientVisit.create(newPatientVisitData);

        await LogService.logActivity({
            actor: req.user,
            action: 'CREATE_PATIENT_VISIT',
            entity: {
                type: 'PatientVisit',
                id: createdPatientVisit._id.toString(),
                name: `${doctor.name}`
            },
            details: {
                patientVisit: createdPatientVisit.toObject(),
                patientId: finalPatientId,
                patientName: `${patient.firstName} ${patient.lastName || ''}`.trim(),
            },
            request: req
        });

        res.status(201).json(createdPatientVisit);
    } catch (error) {
        console.error('Error creating patient visit:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.updatePatientVisit = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:edit') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }
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
        const updatedPatientVisit = await PatientVisit.findByIdAndUpdate(
            id,
            allowedUpdates,
            { new: true, runValidators: true }
        );
        if (!updatedPatientVisit) {
            return res.status(404).json({ message: 'Patient visit not found' });
        }
        const patient = await Patient.findById(updatedPatientVisit.patientId);
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_PATIENT_VISIT',
            entity: {
                type: 'PatientVisit',
                id: updatedPatientVisit._id.toString(),
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                changes: allowedUpdates
            },
            request: req
        });
        res.json(updatedPatientVisit);
    } catch (error) {
        res.status(400).json({ message: 'Error updating patient visit' });
    }
};

exports.softDeletePatientVisit = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:delete') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id } = req.params;
        const patientVisitToSoftDelete = await PatientVisit.findById(id);
        if (!patientVisitToSoftDelete) {
            return res.status(404).json({ message: 'Patient visit not found' });
        }
        const patient = await Patient.findById(patientVisitToSoftDelete.patientId);
        const updatedPatientVisit = await PatientVisit.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );
        if (!updatedPatientVisit) {
            return res.status(500).json({ message: 'Failed to delete patient visit' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'SOFT_DELETE_PATIENT_VISIT',
            entity: {
                type: 'PatientVisit',
                id: id,
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                deletedPatientVisit: updatedPatientVisit.toObject()
            },
            request: req
        });
        res.json(updatedPatientVisit);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting patient visit' });
    }
};

exports.restorePatientVisit = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { id } = req.params;
        const patientVisitToRestore = await PatientVisit.findById(id);
        if (!patientVisitToRestore) {
            return res.status(404).json({ message: 'Patient visit not found' });
        }
        const restoredPatientVisit = await PatientVisit.findByIdAndUpdate(
            id,
            { $unset: { deletedAt: 1 } },
            { new: true }
        );
        if (!restoredPatientVisit) {
            return res.status(500).json({ message: 'Failed to restore patient visit' });
        }
        const patient = await Patient.findById(restoredPatientVisit.patientId);
        await LogService.logActivity({
            actor: req.user,
            action: 'RESTORE_PATIENT_VISIT',
            entity: {
                type: 'PatientVisit',
                id: id,
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                restoredPatientVisit: restoredPatientVisit.toObject()
            },
            request: req
        });
        res.json(restoredPatientVisit);
    } catch (error) {
        res.status(500).json({ message: 'Error restoring patient visit' });
    }
};

exports.permanentDeletePatientVisit = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: Admins only' });
        }
        const { id } = req.params;
        const patientVisitToDelete = await PatientVisit.findById(id);
        if (!patientVisitToDelete) {
            return res.status(404).json({ message: 'Patient visit not found' });
        }
        const patient = await Patient.findById(patientVisitToDelete.patientId);
        const deletedPatientVisit = await PatientVisit.findByIdAndDelete(id);
        if (!deletedPatientVisit) {
            return res.status(404).json({ message: 'Patient visit not found during deletion' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'PERMANENT_DELETE_PATIENT_VISIT',
            entity: {
                type: 'PatientVisit',
                id: id,
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                deletedPatientVisit: patientVisitToDelete.toObject()
            },
            request: req
        });
        res.status(204).json({ message: 'Patient visit permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error permanently deleting patient visit' });
    }
};

exports.updatePatientVisitStatus = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const { status } = req.body;
        const patientVisit = await PatientVisit.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!patientVisit) {
            return res.status(404).json({ message: 'Patient visit not found' });
        }
        const patient = await Patient.findById(patientVisit.patientId);
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_PATIENT_VISIT_STATUS',
            entity: {
                type: 'PatientVisit',
                id: patientVisit._id.toString(),
                name: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            },
            details: {
                newStatus: status,
                previousStatus: patientVisit.status
            },
            request: req
        });
        res.json(patientVisit);
    } catch (error) {
        res.status(400).json({ message: 'Error updating patient visit status' });
    }
};

// Get patient visits by patient ID
exports.getPatientVisitsByPatientId = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const { patientId } = req.params;
        const patientVisits = await PatientVisit.find({ patientId, deletedAt: null })
            .populate('serviceId', 'name description price')
            .populate('doctorId', 'name email')
            .populate('referedBy', 'name email')
            .sort({ date: -1, time: -1 });
            
        res.json(patientVisits);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patient visits' });
    }
};

// Get patient visits by doctor ID
exports.getPatientVisitsByDoctorId = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const { doctorId } = req.params;
        const patientVisits = await PatientVisit.find({ doctorId, deletedAt: null })
            .populate('patientId', 'firstName lastName contact age gender')
            .populate('serviceId', 'name description price')
            .populate('referedBy', 'name email')
            .sort({ date: -1, time: -1 });
            
        res.json(patientVisits);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patient visits' });
    }
};

// Get patient visits by date range
exports.getPatientVisitsByDateRange = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required' });
        }
        
        const query = {
            date: { $gte: startDate, $lte: endDate },
            deletedAt: null
        };
        
        const patientVisits = await PatientVisit.find(query)
            .populate('patientId', 'firstName lastName contact age gender')
            .populate('serviceId', 'name description price')
            .populate('doctorId', 'name email')
            .populate('referedBy', 'name email')
            .sort({ date: -1, time: -1 });
            
        res.json(patientVisits);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patient visits' });
    }
};

// Search patient visits
exports.searchPatientVisits = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const { search, status, doctorId, serviceId, date } = req.query;
        let query = { deletedAt: null };
        
        if (search) {
            query.$or = [
                { patientName: { $regex: search, $options: 'i' } },
                { patientPhone: { $regex: search, $options: 'i' } },
                { doctor: { $regex: search, $options: 'i' } },
                { service: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) query.status = status;
        if (doctorId) query.doctorId = doctorId;
        if (serviceId) query.serviceId = serviceId;
        if (date) query.date = date;
        
        const patientVisits = await PatientVisit.find(query)
            .populate('patientId', 'firstName lastName contact age gender')
            .populate('serviceId', 'name description price')
            .populate('doctorId', 'name email')
            .populate('referedBy', 'name email')
            .sort({ createdAt: -1 });
            
        res.json(patientVisits);
    } catch (error) {
        res.status(500).json({ message: 'Error searching patient visits' });
    }
};

// Get patient visit statistics
exports.getPatientVisitStats = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/patient-visits:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        
        const stats = await PatientVisit.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const totalVisits = await PatientVisit.countDocuments({ deletedAt: null });
        const todayVisits = await PatientVisit.countDocuments({
            date: new Date().toISOString().split('T')[0],
            deletedAt: null
        });
        
        res.json({
            totalVisits,
            todayVisits,
            statusBreakdown: stats
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patient visit statistics' });
    }
};

module.exports = exports;