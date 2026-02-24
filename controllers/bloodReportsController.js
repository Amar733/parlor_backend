const BloodReport = require('../models/BloodReport');
const Patient = require('../models/Patient');
const LogService = require('../services/logService');
const FileManager = require('../services/fileManager');
const { buildRoleBasedQuery } = require('../middleware/roleBasedFilter');

// Helper function to check permissions (similar to your hasPermission)
const hasPermission = (user, permission) => {
    // Admin always has all permissions
    if (user.role === 'admin') return true;
    
    // Doctor role permissions for blood reports access
    if (user.role === 'doctor') {
        if (permission.startsWith('/dashboard/blood-reports:')) {
            return true;
        }
    }
    
    // Check specific permissions for other roles
    return user.permissions && user.permissions.includes(permission);
};

exports.getAllBloodReports = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-reports:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { page = 1, limit = 10, patientId, patientName } = req.query;
        let query = {};
        query.deletedAt = { $exists: false };
        if (patientId) query.patientId = patientId;
        if (patientName) query.patientName = { $regex: patientName, $options: 'i' };
        
        // Apply role-based filtering
        query = buildRoleBasedQuery(req, query);
        
        const bloodReports = await BloodReport.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        // Map _id to id for each report
        const mappedReports = bloodReports.map(report => {
            const obj = report.toObject();
            delete obj._id;
            delete obj.__v;
            return obj;
        });
        const total = await BloodReport.countDocuments(query);
        res.json({
            success: true,
            data: {
                bloodReports: mappedReports,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching reports' });
    }
};

exports.getBloodReportById = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-reports:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const bloodReport = await BloodReport.findById(req.params.id);
        if (!bloodReport) {
            return res.status(404).json({ success: false, message: 'Blood report not found' });
        }
        if (bloodReport) {
            const obj = bloodReport.toObject();
            delete obj._id;
            delete obj.__v;
            res.json({ success: true, data: obj });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBloodReport = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-reports:create') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Missing file or patient ID' });
        }
        const { patientId } = req.body;
        if (!patientId) {
            return res.status(400).json({ success: false, message: 'Missing file or patient ID' });
        }
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        const bloodReportData = {
            patientId: patient._id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            fileUrl: `/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
            uploadedBy: req.user.name,
            uploadedById: req.user._id,
            createdAt: new Date()
        };
        const bloodReport = new BloodReport(bloodReportData);
        const createdReport = await bloodReport.save();
        await LogService.logActivity({
            actor: req.user,
            action: 'CREATE_BLOOD_REPORT',
            entity: {
                type: 'BloodReport',
                id: createdReport._id.toString(),
                name: `${createdReport.patientName} - ${createdReport.fileName}`
            },
            details: { report: createdReport.toObject() },
            request: req
        });
        if (createdReport) {
            const obj = createdReport.toObject();
            delete obj._id;
            delete obj.__v;
            res.status(201).json({ success: true, data: obj, message: 'Blood report uploaded successfully' });
        }
    } catch (error) {
        console.error("Error creating blood report:", error);
        res.status(500).json({ success: false, message: 'Error creating report' });
    }
};

exports.updateBloodReport = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-reports:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { id } = req.params;
        const currentReport = await BloodReport.findById(id);
        if (!currentReport) {
            return res.status(404).json({ success: false, message: 'Blood report not found' });
        }
        const updateData = {
            patientId: req.body.patientId,
            patientName: req.body.patientName
        };
        if (req.file) {
            if (currentReport.fileUrl) {
                await FileManager.moveFileToBin(currentReport.fileUrl);
            }
            updateData.fileUrl = `/uploads/${req.file.filename}`;
            updateData.fileName = req.file.originalname;
        }
        const bloodReport = await BloodReport.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!bloodReport) {
            return res.status(404).json({ success: false, message: 'Blood report not found' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_BLOOD_REPORT',
            entity: {
                type: 'BloodReport',
                id: bloodReport._id.toString(),
                name: `${bloodReport.patientName} - ${bloodReport.fileName}`
            },
            details: {
                previousData: currentReport.toObject(),
                updatedData: updateData
            },
            request: req
        });
        if (bloodReport) {
            const obj = bloodReport.toObject();
            delete obj._id;
            delete obj.__v;
            res.json({ success: true, data: obj, message: 'Blood report updated successfully' });
        }
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.softDeleteBloodReport = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-reports:delete') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { id } = req.params;
        const bloodReport = await BloodReport.findById(id);
        if (!bloodReport) {
            return res.status(404).json({ success: false, message: 'Blood report not found' });
        }
        if (bloodReport.fileUrl) {
            const moveResult = await FileManager.moveFileToBin(bloodReport.fileUrl);
            if (moveResult && !moveResult.success && moveResult.reason !== 'file_not_found') {
                console.warn(`Failed to move file to bin: ${bloodReport.fileUrl}`, moveResult);
            }
        }
        const updatedReport = await BloodReport.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );
        await LogService.logActivity({
            actor: req.user,
            action: 'SOFT_DELETE_BLOOD_REPORT',
            entity: {
                type: 'BloodReport',
                id: id,
                name: `${bloodReport.patientName} - ${bloodReport.fileName}`
            },
            details: {
                deletedAt: updatedReport.deletedAt,
                fileMovedToBin: bloodReport.fileUrl ? true : false
            },
            request: req
        });
        res.json({ success: true, message: 'Blood report deleted successfully', fileMovedToBin: bloodReport.fileUrl ? true : false });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreBloodReport = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-reports:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { id } = req.params;
        const reportToRestore = await BloodReport.findById(id);
        if (!reportToRestore) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        const restoredReport = await BloodReport.findByIdAndUpdate(
            id,
            { $unset: { deletedAt: 1 } },
            { new: true }
        );
        if (!restoredReport) {
            return res.status(500).json({ success: false, message: 'Failed to restore report' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'RESTORE_BLOOD_REPORT',
            entity: {
                type: 'BloodReport',
                id: id,
                name: `${restoredReport.patientName} - ${restoredReport.fileName}`
            },
            details: { restored: true },
            request: req
        });
        if (restoredReport) {
            const obj = restoredReport.toObject();
            delete obj._id;
            delete obj.__v;
            res.json({ success: true, data: obj, message: 'Report restored successfully' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error restoring report' });
    }
};

exports.permanentDeleteBloodReport = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admins only' });
        }
        const { id } = req.params;
        const reportToDelete = await BloodReport.findById(id);
        if (!reportToDelete) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        if (reportToDelete.fileUrl) {
            await FileManager.moveFileToBin(reportToDelete.fileUrl);
        }
        const deletedReport = await BloodReport.findByIdAndDelete(id);
        if (!deletedReport) {
            return res.status(404).json({ success: false, message: 'Report not found during deletion' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'PERMANENT_DELETE_BLOOD_REPORT',
            entity: {
                type: 'BloodReport',
                id: id,
                name: `${reportToDelete.patientName} - ${reportToDelete.fileName}`
            },
            details: { permanent: true },
            request: req
        });
        res.status(204).json({ success: true, message: 'Report permanently deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error permanently deleting report' });
    }
};
