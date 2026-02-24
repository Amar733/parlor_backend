const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const bloodReportsController = require('../controllers/bloodReportsController');
const router = express.Router();

// @route   GET /api/blood-reports
// @desc    Get all blood reports
// @access  Private
router.get('/', auth, bloodReportsController.getAllBloodReports);

// @route   GET /api/blood-reports/:id
// @desc    Get blood report by ID
// @access  Private
router.get('/:id', auth, bloodReportsController.getBloodReportById);

// @route   POST /api/blood-reports
// @desc    Upload new blood report
// @access  Private
router.post('/', auth, upload.single('file'), bloodReportsController.createBloodReport);

// @route   PUT /api/blood-reports/:id
// @desc    Update blood report
// @access  Private
router.put('/:id', auth, upload.single('file'), bloodReportsController.updateBloodReport);

// @route   DELETE /api/blood-reports/:id
// @desc    Soft delete blood report
// @access  Private
router.delete('/:id', auth, bloodReportsController.softDeleteBloodReport);

// @route   POST /api/blood-reports/:id/restore
// @desc    Restore soft-deleted blood report
// @access  Private
router.post('/:id/restore', auth, bloodReportsController.restoreBloodReport);

// @route   DELETE /api/blood-reports/:id/permanent
// @desc    Permanently delete blood report (admin only)
// @access  Private (Admin only)
router.delete('/:id/permanent', auth, bloodReportsController.permanentDeleteBloodReport);

module.exports = router;
