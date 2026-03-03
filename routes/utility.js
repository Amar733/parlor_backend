const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { backupUpload } = require('../middleware/upload');
const utilityController = require('../controllers/utilityController');
const router = express.Router();

// @route   POST /api/utility/backups/upload
// @desc    Upload a backup file to history
// @access  Private (Admin only)
router.post('/backups/upload', auth, authorize('admin'), backupUpload.single('backup'), utilityController.uploadBackup);

// @route   POST /api/utility/backups/restore/:filename
// @desc    Restore database from an existing backup file
// @access  Private (Admin only)
router.post('/backups/restore/:filename', auth, authorize('admin'), utilityController.restoreBackup);

// @route   GET /api/utility/charges
// @desc    Get all charges
// @access  Public (so users can see fees)
router.get('/charges', utilityController.getCharges);

// @route   GET /api/utility/backups
// @desc    List all backups
// @access  Private (Admin only)
router.get('/backups', auth, authorize('admin'), utilityController.listBackups);

// @route   GET /api/utility/backups/download/:filename
// @desc    Download a specific backup file
// @access  Private (Admin only)
router.get('/backups/download/:filename', auth, authorize('admin'), utilityController.downloadBackup);

// @route   DELETE /api/utility/backups/:filename
// @desc    Delete a specific backup file
// @access  Private (Admin only)
router.delete('/backups/:filename', auth, authorize('admin'), utilityController.deleteBackup);

// @route   POST /api/utility/backup
// @desc    Run a manual database backup
// @access  Private (Admin only)
router.post('/backup', auth, authorize('admin'), utilityController.runBackup);

// @route   POST /api/utility/charges
// @desc    Create a new charge
// @access  Private (Admin only)
router.post('/charges', auth, authorize('admin'), utilityController.createCharge);

// @route   GET /api/utility/charges/:id
// @desc    Get a specific charge by ID
// @access  Private (Admin only)
// router.get('/charges/:id', auth, authorize('admin'), utilityController.getChargeById);

// @route   PUT /api/utility/charges/:id
// @desc    Update a specific charge by ID
// @access  Private (Admin only)
router.put('/charges/:id', auth, authorize('admin'), utilityController.updateCharge);

// @route   DELETE /api/utility/charges/:id
// @desc    Delete a specific charge by ID
// @access  Private (Admin only)
router.delete('/charges/:id', auth, authorize('admin'), utilityController.deleteCharge);


module.exports = router;
