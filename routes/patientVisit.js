const express = require('express');
const { auth, authorize } = require('../middleware/auth');
// const appointmentBookingController = require('../controllers/appointmentBookingController');
const patientVisitController = require('../controllers/patientVisitController');
const router = express.Router();


// @route   GET /api/appointments
// @desc    Get all appointments (simple array response)
// @access  Private
router.get('/', auth, patientVisitController.getAllPatientVisits);


// @route   GET /api/appointments/:id
// @desc    Get appointment by ID (simple response)
// @access  Private
router.get('/:id', auth, patientVisitController.getPatientVisitById);

// @route   POST /api/appointments
// @desc    Create new appointment (simple response)
// @access  Private
router.post('/', auth, patientVisitController.createPatientVisit);


// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private (Admin or users with edit permission)
router.put('/:id', auth, patientVisitController.updatePatientVisit);

// @route   DELETE /api/appointments/:id
// @desc    Soft delete appointment
// @access  Private (Admin or users with delete permission)
router.delete('/:id', auth, patientVisitController.softDeletePatientVisit);

// @route   POST /api/appointments/:id/restore
// @desc    Restore soft-deleted appointment
// @access  Private
router.post('/:id/restore', auth, patientVisitController.restorePatientVisit);

// @route   DELETE /api/appointments/:id/permanent
// @desc    Permanently delete appointment (admin only)
// @access  Private (Admin only)
router.delete('/:id/permanent', auth, patientVisitController.permanentDeletePatientVisit);

// @route   PATCH /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.patch('/:id/status', auth, patientVisitController.updatePatientVisitStatus);

module.exports = router;
