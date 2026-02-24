const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();
const prescriptionsController = require('../controllers/prescriptionsController');

// @route   GET /api/prescriptions
// @desc    Get all prescriptions with pagination and search
// @access  Private
router.get('/', auth, prescriptionsController.getAllPrescriptions);

// @route   GET /api/prescriptions/:id
// @desc    Get prescription by ID
// @access  Private
router.get('/:id', auth, prescriptionsController.getPrescriptionById);

// @route   POST /api/prescriptions
// @desc    Create new prescription
// @access  Private
// @route   POST /api/prescriptions
// @desc    Create new prescription
// @access  Private
router.post('/', auth, prescriptionsController.createPrescription);

// @route   POST /api/prescriptions/share
// @desc    Share prescription via WhatsApp
// @access  Public (Temporary)
router.post('/share', prescriptionsController.sharePrescription);

// @route   PUT /api/prescriptions/:id
// @desc    Update prescription
// @access  Private
router.put('/:id', auth, prescriptionsController.updatePrescription);

// @route   GET /api/prescriptions/patient/:patientId
// @desc    Get all prescriptions for a specific patient
// @access  Private
router.get('/patient/:patientId', auth, prescriptionsController.getPrescriptionsByPatient);

// @route   GET /api/prescriptions/doctor/:doctorId
// @desc    Get all prescriptions for a specific doctor
// @access  Private
router.get('/doctor/:doctorId', auth, prescriptionsController.getPrescriptionsByDoctor);

// @route   DELETE /api/prescriptions/:id
// @desc    Soft delete prescription
// @access  Private
router.delete('/:id', auth, prescriptionsController.softDeletePrescription);

// @route   POST /api/prescriptions/:id/restore
// @desc    Restore soft deleted prescription
// @access  Private
router.post('/:id/restore', auth, prescriptionsController.restorePrescription);

// @route   DELETE /api/prescriptions/:id/permanent
// @desc    Permanently delete prescription
// @access  Private (Admin only)
router.delete('/:id/permanent', auth, authorize(['admin']), prescriptionsController.permanentDeletePrescription);

module.exports = router;