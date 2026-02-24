const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const ManagedUser = require('../models/ManagedUser');
const LogService = require('../services/logService');
const { buildRoleBasedQuery } = require('../middleware/roleBasedFilter');
const interaktService = require('../services/interaktService');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    if (user.role === 'doctor') {
        if (permission.startsWith('/dashboard/prescriptions:')) {
            return true;
        }
    }
    return user.permissions && user.permissions.includes(permission);
};

// Get all prescriptions
exports.getAllPrescriptions = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/prescriptions:read') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }

        const { page = 1, limit = 10, patientId, doctorId, search } = req.query;
        let query = { deletedAt: null };

        if (patientId) query.patientId = patientId;
        if (doctorId) query.doctorId = doctorId;
        if (search) {
            query.$or = [
                { 'patient.name': { $regex: search, $options: 'i' } },
                { 'doctor.name': { $regex: search, $options: 'i' } },
                { 'notes.diagnosis': { $regex: search, $options: 'i' } }
            ];
        }

        // query = buildRoleBasedQuery(req, query);

        const prescriptions = await Prescription.find(query)
            .populate('patientId', 'firstName lastName contact')
            .populate('doctorId', 'name email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Prescription.countDocuments(query);

        res.json({
            success: true,
            data: prescriptions,
            pagination: {
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get prescription by ID
exports.getPrescriptionById = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/prescriptions:read') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }

        const query = { _id: req.params.id, deletedAt: null };
        // const query = buildRoleBasedQuery(req, { _id: req.params.id, deletedAt: null });

        const prescription = await Prescription.findOne(query)
            .populate('patientId', 'firstName lastName contact age gender address')
            .populate('doctorId', 'name email');

        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }

        res.json({ success: true, data: prescription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new prescription
exports.createPrescription = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/prescriptions:create') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }

        const {
            visitDate,
            patient,
            doctor,
            notes,
            medications,
            templateTheme,
            canvasData,
            canvasPages,
            patientId,
            doctorId
        } = req.body;

        // Validate required fields
        if (!patientId || !doctorId) {
            return res.status(400).json({
                success: false,
                message: 'patientId and doctorId are required'
            });
        }

        // Verify patient and doctor exist
        const [patientExists, doctorExists] = await Promise.all([
            Patient.findById(patientId),
            ManagedUser.findById(doctorId)
        ]);

        if (!patientExists) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        if (!doctorExists) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const prescriptionData = {
            visitDate: visitDate || new Date(),
            patient: patient || {
                name: `${patientExists.firstName} ${patientExists.lastName}`,
                age: patientExists.age?.toString() || '',
                sex: patientExists.gender || '',
                contact: patientExists.contact || '',
                address: patientExists.address || ''

            },
            doctor: doctor || {
                name: doctorExists.name,
                degree: doctorExists.degree || '',
                speciality: doctorExists.speciality || '',
                regNo: doctorExists.regNo || '',
                clinicName: doctorExists.clinicName || '',
                contact: doctorExists.contact || ''
            },
            notes: notes || {},
            medications: medications || [],
            canvasData: canvasData || '',
            canvasPages: canvasPages || [],
            templateTheme: templateTheme || '',
            patientId,
            doctorId,
            uploadedBy: req.user?.name || 'System'
        };

        const prescription = await Prescription.create(prescriptionData);

        await LogService.logActivity({
            actor: req.user,
            action: 'CREATE_PRESCRIPTION',
            entity: {
                type: 'Prescription',
                id: prescription._id.toString(),
                name: `Prescription for ${prescription.patient.name}`
            },
            details: {
                patientId,
                doctorId,
                visitDate: prescription.visitDate
            },
            request: req
        });

        res.status(201).json({ success: true, data: prescription });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update prescription
exports.updatePrescription = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/prescriptions:edit') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }

        const { id } = req.params;
        const updateData = req.body;

        const prescription = await Prescription.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }

        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_PRESCRIPTION',
            entity: {
                type: 'Prescription',
                id: prescription._id.toString(),
                name: `Prescription for ${prescription.patient.name}`
            },
            details: { changes: updateData },
            request: req
        });

        res.json({ success: true, data: prescription });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Get prescriptions by patient ID
exports.getPrescriptionsByPatient = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/prescriptions:read') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }

        const { patientId } = req.params;
        const prescriptions = await Prescription.find({
            patientId,
            deletedAt: null
        })
            .populate('doctorId', 'name email')
            .sort({ visitDate: -1 });

        res.json({ success: true, data: prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get prescriptions by doctor ID
exports.getPrescriptionsByDoctor = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/prescriptions:read') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }

        const { doctorId } = req.params;
        const prescriptions = await Prescription.find({
            doctorId,
            deletedAt: null
        })
            .populate('patientId', 'firstName lastName contact')
            .sort({ visitDate: -1 });

        res.json({ success: true, data: prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Soft delete prescription
exports.softDeletePrescription = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/prescriptions:delete') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }

        const { id } = req.params;
        const prescription = await Prescription.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );

        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }

        await LogService.logActivity({
            actor: req.user,
            action: 'SOFT_DELETE_PRESCRIPTION',
            entity: {
                type: 'Prescription',
                id: prescription._id.toString(),
                name: `Prescription for ${prescription.patient.name}`
            },
            details: { deletedAt: prescription.deletedAt },
            request: req
        });

        res.json({ success: true, message: 'Prescription deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Restore prescription
exports.restorePrescription = async (req, res) => {
    try {
        // if (!req.user || (!hasPermission(req.user, '/dashboard/prescriptions:edit') && req.user.role !== 'admin')) {
        //     return res.status(403).json({ message: 'Forbidden' });
        // }

        const { id } = req.params;
        const prescription = await Prescription.findByIdAndUpdate(
            id,
            { $unset: { deletedAt: 1 } },
            { new: true }
        );

        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }

        await LogService.logActivity({
            actor: req.user,
            action: 'RESTORE_PRESCRIPTION',
            entity: {
                type: 'Prescription',
                id: prescription._id.toString(),
                name: `Prescription for ${prescription.patient.name}`
            },
            request: req
        });

        res.json({ success: true, data: prescription });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Permanent delete prescription
exports.permanentDeletePrescription = async (req, res) => {
    try {
        // if (!req.user || req.user.role !== 'admin') {
        //     return res.status(403).json({ message: 'Unauthorized: Admins only' });
        // }

        const { id } = req.params;
        const prescription = await Prescription.findByIdAndDelete(id);

        if (!prescription) {
            return res.status(404).json({ success: false, message: 'Prescription not found' });
        }

        await LogService.logActivity({
            actor: req.user,
            action: 'PERMANENT_DELETE_PRESCRIPTION',
            entity: {
                type: 'Prescription',
                id: prescription._id.toString(),
                name: `Prescription for ${prescription.patient.name}`
            },
            details: { deletedPrescription: prescription.toObject() },
            request: req
        });

        res.status(204).json({ success: true, message: 'Prescription permanently deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Share prescription via WhatsApp
exports.sharePrescription = async (req, res) => {
    try {
        const {
            countryCode = "+91",
            phoneNumber,
            doctorPhoneNumber,
            doctorName,
            patientName,
            date,
            time,
            pdfUrl,
            fileName
        } = req.body;

        if (!phoneNumber || !pdfUrl) {
            return res.status(400).json({ success: false, message: 'Phone number and PDF URL are required' });
        }

        const cleanDoctorName = doctorName || "Doctor";
        const cleanPatientName = patientName || "Patient";
        const cleanDate = date || new Date().toLocaleDateString();
        const cleanTime = time || new Date().toLocaleTimeString();
        const cleanFileName = fileName || "doctor.pdf";

        const sendPromises = [];

        // 1. Prepare Patient Message (Template: dp_customer_1)
        // Variables: {{1}}=Patient, {{2}}=Doctor, {{3}}=Date, {{4}}=Time
        const fullPatientNumber = countryCode ? `${countryCode}${phoneNumber}` : phoneNumber;
        const patientTemplate = {
            name: "dp_customer_1",
            languageCode: "en",
            headerValues: [pdfUrl],
            fileName: cleanFileName,
            bodyValues: [
                cleanPatientName,
                cleanDoctorName,
                cleanDate,
                cleanTime
            ]
        };

        sendPromises.push(
            interaktService.sendWhatsAppMessage(fullPatientNumber, { type: 'Template', template: patientTemplate })
                .then(result => ({ recipient: 'patient', success: result.success, error: result.error, number: fullPatientNumber }))
        );

        // 2. Prepare Doctor Message (Template: dp_clinic_1)
        // Variables: {{1}}=Doctor, {{2}}=Patient, {{3}}=Date, {{4}}=Time
        if (doctorPhoneNumber) {
            // Assume doctor phone might not have country code, or use same default
            // Usually doctor phone in DB includes country code or needs it. 
            // We'll clean it and assume '91' if length is 10, handled by interaktService helper.
            const doctorTemplate = {
                name: "dp_clinic_1",
                languageCode: "en",
                headerValues: [pdfUrl],
                fileName: cleanFileName,
                bodyValues: [
                    cleanDoctorName,
                    cleanPatientName,
                    cleanDate,
                    cleanTime
                ]
            };

            sendPromises.push(
                interaktService.sendWhatsAppMessage(doctorPhoneNumber, { type: 'Template', template: doctorTemplate })
                    .then(result => ({ recipient: 'doctor', success: result.success, error: result.error, number: doctorPhoneNumber }))
            );
        }

        // Execute all sends
        const results = await Promise.all(sendPromises);

        // Logging
        for (const res of results) {
            if (res.success) {
                await LogService.logActivity({
                    actor: req.user || { id: 'public_share', name: 'Public Share User', role: 'guest' },
                    action: 'SHARE_PRESCRIPTION_WHATSAPP',
                    entity: { type: 'PrescriptionShare', name: `Shared with ${res.recipient}` },
                    details: { phoneNumber: res.number, recipient: res.recipient },
                    request: req
                });
            }
        }

        // Determine overall success (if at least one succeeded or if patient succeeded)
        const patientResult = results.find(r => r.recipient === 'patient');
        if (patientResult && patientResult.success) {
            res.json({ success: true, message: 'Prescription shared successfully', results });
        } else if (results.some(r => r.success)) {
            res.json({ success: true, message: 'Prescription shared with doctor only', results });
        } else {
            res.status(500).json({ success: false, message: 'Failed to share prescription', results });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};