const express = require('express');
const { auth } = require('../middleware/auth');
const activityLogsController = require('../controllers/activityLogsController');
const router = express.Router();

// @route   GET /api/activity-logs
// @desc    Get all activity logs
// @access  Private (Admin only)
router.get('/', auth, activityLogsController.getAllActivityLogs);

// @route   GET /api/activity-logs/:id
// @desc    Get activity log by ID
// @access  Private (Admin only)
router.get('/:id', auth, activityLogsController.getActivityLogById);

// @route   POST /api/activity-logs
// @desc    Create new activity log (internal use - handled by LogService)
// @access  Private (Admin only)
router.post('/', auth, activityLogsController.createActivityLog);

// @route   DELETE /api/activity-logs/:id
// @desc    Delete activity log (admin only)
// @access  Private (Admin only)
router.delete('/:id', auth, activityLogsController.deleteActivityLog);

// @route   GET /api/activity-logs/user/:userId
// @desc    Get activity logs by user ID
// @access  Private
router.get('/user/:userId', auth, activityLogsController.getActivityLogsByUserId);

// @route   GET /api/activity-logs/entity/:entityType/:entityId
// @desc    Get activity logs for a specific entity (admin only)
// @access  Private (Admin only)
router.get('/entity/:entityType/:entityId', auth, activityLogsController.getActivityLogsByEntity);

// @route   GET /api/activity-logs/stats
// @desc    Get activity log statistics (admin only)
// @access  Private (Admin only)
router.get('/stats', auth, activityLogsController.getActivityLogStats);

module.exports = router;
