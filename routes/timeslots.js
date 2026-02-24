const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const timeslotsController = require('../controllers/timeslotsController');
const router = express.Router();

// @route   GET /api/timeslots
// @desc    Get available time slots for a doctor on a specific date OR master list for admins
// @access  Public (for booking) / Private (for master list)
router.get('/', timeslotsController.getTimeSlots);

// @route   PUT /api/timeslots
// @desc    Update the master list of time slots
// @access  Private (Admin only)
router.put('/', auth, authorize('admin'), timeslotsController.updateMasterTimeSlots);

// @route   GET /api/timeslots/doctor/:doctorId
// @desc    Get a specific doctor's available slots (their profile settings)
// @access  Private
router.get('/doctor/:doctorId', timeslotsController.getDoctorSlots);

// @route   PUT /api/timeslots/doctor/:doctorId
// @desc    Update a specific doctor's available slots
// @access  Private (Admin or the doctor themselves)
router.put('/doctor/:doctorId', auth, timeslotsController.updateDoctorSlots);

// @route   GET /api/timeslots/availability/:doctorId/:date
// @desc    Get detailed availability info for a doctor on a specific date
// @access  Public
router.get('/availability/:doctorId/:date', timeslotsController.getDoctorAvailability);

// @route   PUT /api/timeslots/doctor/:doctorId/capacity
// @desc    Update doctor's patient capacity per slot
// @access  Private (Admin or the doctor themselves)
router.put('/doctor/:doctorId/capacity', auth, timeslotsController.updateDoctorCapacity);

// @route   PUT /api/timeslots/doctor/:doctorId/:day
// @desc    Update doctor's slots for a specific day
// @access  Private (Admin or the doctor themselves)
router.put('/doctor/:doctorId/:day', auth, timeslotsController.updateDoctorDaySlots);

// @route   GET /api/timeslots/capacity
// @desc    Get slot capacity for booking validation
// @access  Public
router.get('/capacity', timeslotsController.getSlotCapacity);

module.exports = router;
