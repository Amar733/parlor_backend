const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const binController = require('../controllers/binController');
const router = express.Router();

// @route   GET /api/bin
// @desc    List files in bin directory
// @access  Private (Admin only)
router.get('/', auth, authorize('admin'), binController.listBinFiles);

// @route   POST /api/bin/restore
// @desc    Restore file from bin to uploads
// @access  Private (Admin only)
router.post('/restore', auth, authorize('admin'), binController.restoreFile);

// @route   DELETE /api/bin/permanent
// @desc    Permanently delete files from bin
// @access  Private (Admin only)
router.delete('/permanent', auth, authorize('admin'), binController.permanentlyDelete);

// @route   POST /api/bin/cleanup
// @desc    Clean up old files from bin
// @access  Private (Admin only)
router.post('/cleanup', auth, authorize('admin'), binController.cleanupBin);

// @route   GET /api/bin/stats
// @desc    Get bin statistics
// @access  Private (Admin only)
router.get('/stats', auth, authorize('admin'), binController.getBinStats);

module.exports = router;
