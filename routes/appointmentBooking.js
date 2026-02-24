const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const appointmentBookingController = require('../controllers/appointmentBookingController');
const router = express.Router();

// @route   GET /api/appointment-booking/check-availability
// @desc    Check if a specific time slot is available for booking
// @access  Public
router.get('/check-availability', appointmentBookingController.checkSlotAvailability);

// @route   POST /api/appointment-booking/book
// @desc    Book an appointment with capacity validation
// @access  Public
router.post('/book', appointmentBookingController.bookAppointment);

// @route   GET /api/appointment-booking/slot-appointments
// @desc    Get all appointments for a specific slot (admin/doctor view)
// @access  Private (Admin or Doctor)
router.get('/slot-appointments', auth, authorize(['admin', 'doctor']), appointmentBookingController.getSlotAppointments);

// @route   PUT /api/appointment-booking/cancel/:appointmentId
// @desc    Cancel an appointment and free up the slot
// @access  Public (or Private with better auth)
router.put('/cancel/:appointmentId', appointmentBookingController.cancelAppointment);

module.exports = router;
