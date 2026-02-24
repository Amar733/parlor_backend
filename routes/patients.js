const express = require('express');
const { auth } = require('../middleware/auth');
const patientsController = require('../controllers/patientsController');
const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients (simple array response like Next.js)
// @access  Private
router.get('/', auth, patientsController.getAllPatients);

// @route   POST /api/patients
// @desc    Create new patient (with Next.js logic)
// @access  Private
router.post('/', auth, patientsController.createPatient);
router.post('/bulk', patientsController.createPatientBulk);

// @route   DELETE /api/patients/delete-all
// @desc    Delete all patients
// @access  Private
router.delete('/delete-all', patientsController.deleteAllPatients);

// @route   GET /api/patients/:id
// @desc    Get patient by ID (simple response like Next.js)
// @access  Private
router.get('/:id', auth, patientsController.getPatientById);

// @route   PUT /api/patients/:id
// @desc    Update patient (simple response like Next.js)
// @access  Private (Admin or users with edit permission)
router.put('/:id', auth, patientsController.updatePatient);

// @route   DELETE /api/patients/:id
// @desc    Soft delete patient (simple response like Next.js)
// @access  Private (Admin or users with delete permission)
router.delete('/:id', auth, patientsController.softDeletePatient);

// @route   POST /api/patients/:id/restore
// @desc    Restore soft-deleted patient (simple response like Next.js)
// @access  Private (Admin or users with edit permission)
router.post('/:id/restore', auth, patientsController.restorePatient);

// @route   DELETE /api/patients/:id/permanent
// @desc    Permanently delete patient (simple response like Next.js)
// @access  Private (Admin only)
router.delete('/:id/permanent', auth, patientsController.permanentDeletePatient);

module.exports = router;
