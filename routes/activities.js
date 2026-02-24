const express = require('express');
const { auth } = require('../middleware/auth');
const activitiesController = require('../controllers/activitiesController');
const router = express.Router();

// @route   GET /api/activities
// @desc    Get all activities
// @access  Public
router.get('/', activitiesController.getAllActivities);

// @route   GET /api/activities/:id
// @desc    Get activity by ID
// @access  Public
router.get('/:id', activitiesController.getActivityById);

// @route   POST /api/activities
// @desc    Create new activity
// @access  Private (Admin or users with create permission)
router.post('/', auth, activitiesController.createActivity);

// @route   PUT /api/activities/:id
// @desc    Update activity
// @access  Private (Admin or users with edit permission)
router.put('/:id', auth, activitiesController.updateActivity);

// @route   DELETE /api/activities/:id
// @desc    Soft delete activity
// @access  Private (Admin or users with delete permission)
router.delete('/:id', auth, activitiesController.softDeleteActivity);

// @route   POST /api/activities/:id/restore
// @desc    Restore soft-deleted activity
// @access  Private (Admin or users with edit permission)
router.post('/:id/restore', auth, activitiesController.restoreActivity);

// @route   DELETE /api/activities/:id/permanent
// @desc    Permanently delete activity (admin only)
// @access  Private (Admin only)
router.delete('/:id/permanent', auth, activitiesController.permanentDeleteActivity);

module.exports = router;
