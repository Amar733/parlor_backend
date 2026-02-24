const express = require('express');
const { auth } = require('../middleware/auth');
const appointmentsController = require('../controllers/appointmentsController');
const router = express.Router();

// @route   GET /api/appointments
// @desc    Get all appointments (simple array response)
// @access  Private
router.get('/', auth, appointmentsController.getAllAppointments);


// @route   GET /api/appointments/:id
// @desc    Get appointment by ID (simple response)
// @access  Private
router.get('/:id', auth, appointmentsController.getAppointmentById);

// @route   POST /api/appointments
// @desc    Create new appointment (simple response)
// @access  Private
router.post('/', auth, appointmentsController.createAppointment);


// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private (Admin or users with edit permission)
router.put('/:id', auth, appointmentsController.updateAppointment);

// @route   DELETE /api/appointments/:id
// @desc    Soft delete appointment
// @access  Private (Admin or users with delete permission)
router.delete('/:id', auth, appointmentsController.softDeleteAppointment);

// @route   POST /api/appointments/:id/restore
// @desc    Restore soft-deleted appointment
// @access  Private
router.post('/:id/restore', auth, appointmentsController.restoreAppointment);

// @route   DELETE /api/appointments/:id/permanent
// @desc    Permanently delete appointment (admin only)
// @access  Private (Admin only)
router.delete('/:id/permanent', auth, appointmentsController.permanentDeleteAppointment);

// @route   PATCH /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.patch('/:id/status', auth, appointmentsController.updateAppointmentStatus);

// @route   GET /api/appointments/meet/:linkId
// @desc    Verify meeting link
// @access  Public (or protected if needed)
router.get('/meet/:linkId', appointmentsController.getMeetingByLink);

module.exports = router;
