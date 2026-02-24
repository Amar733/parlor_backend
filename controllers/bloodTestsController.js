const BloodTest = require('../models/BloodTest');
const LogService = require('../services/logService');

// Helper function to check permissions (similar to your hasPermission)
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

exports.getAllBloodTests = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-tests:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { page = 1, limit = 10, search, status, testType } = req.query;
        const query = {};
        if (status) query.status = status;
        if (testType) query.testType = testType;
        if (search) {
            query.$or = [
                { patientName: { $regex: search, $options: 'i' } },
                { testType: { $regex: search, $options: 'i' } }
            ];
        }
        const tests = await BloodTest.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ date: -1 });
        const total = await BloodTest.countDocuments(query);
        res.json({
            success: true,
            data: {
                tests,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching blood tests' });
    }
};

exports.getBloodTestById = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-tests:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const test = await BloodTest.findById(req.params.id);
        if (!test) {
            return res.status(404).json({ success: false, message: 'Blood test not found' });
        }
        res.json({ success: true, data: test });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBloodTest = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-tests:create') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { patientName, testType, date, status, results } = req.body;
        if (!patientName || !testType || !date || !status) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const testData = { patientName, testType, date, status, results };
        const test = new BloodTest(testData);
        const createdTest = await test.save();
        await LogService.logActivity({
            actor: req.user,
            action: 'CREATE_BLOOD_TEST',
            entity: {
                type: 'BloodTest',
                id: createdTest._id.toString(),
                name: `${createdTest.patientName} - ${createdTest.testType}`
            },
            details: { test: createdTest.toObject() },
            request: req
        });
        res.status(201).json({ success: true, data: createdTest, message: 'Blood test created successfully' });
    } catch (error) {
        console.error("Error creating blood test:", error);
        res.status(500).json({ success: false, message: 'Error creating blood test' });
    }
};

exports.updateBloodTest = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-tests:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { id } = req.params;
        const currentTest = await BloodTest.findById(id);
        if (!currentTest) {
            return res.status(404).json({ success: false, message: 'Blood test not found' });
        }
        const updatedTest = await BloodTest.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedTest) {
            return res.status(404).json({ success: false, message: 'Blood test not found' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_BLOOD_TEST',
            entity: {
                type: 'BloodTest',
                id: updatedTest._id.toString(),
                name: `${updatedTest.patientName} - ${updatedTest.testType}`
            },
            details: {
                previousData: currentTest.toObject(),
                updatedData: req.body
            },
            request: req
        });
        res.json({ success: true, data: updatedTest, message: 'Blood test updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating blood test' });
    }
};

exports.deleteBloodTest = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/blood-tests:delete') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { id } = req.params;
        const testToDelete = await BloodTest.findById(id);
        if (!testToDelete) {
            return res.status(404).json({ success: false, message: 'Blood test not found' });
        }
        const deletedTest = await BloodTest.findByIdAndDelete(id);
        if (!deletedTest) {
            return res.status(404).json({ success: false, message: 'Blood test not found' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'DELETE_BLOOD_TEST',
            entity: {
                type: 'BloodTest',
                id: id,
                name: `${testToDelete.patientName} - ${testToDelete.testType}`
            },
            details: {
                deletedTest: {
                    patientName: testToDelete.patientName,
                    testType: testToDelete.testType,
                    date: testToDelete.date,
                    status: testToDelete.status
                }
            },
            request: req
        });
        res.status(204).json({ success: true, message: 'Blood test deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting blood test' });
    }
};
