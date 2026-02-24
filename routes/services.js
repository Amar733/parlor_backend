const express = require('express');
const { auth } = require('../middleware/auth');
const servicesController = require('../controllers/servicesController');
const router = express.Router();

// @route   GET /api/services
// @desc    Get all services
// @access  Public
router.get('/', servicesController.getAllServices);

// @route   GET /api/services/doctor/:doctorId
// @desc    Get all services by doctor ID
// @access  Public
router.get('/doctor/:doctorId', servicesController.getServicesByDoctor);

// @route   GET /api/services/:serviceId/doctors
// @desc    Get all doctors by service ID
// @access  Public
router.get('/:serviceId/doctors', servicesController.getDoctorsByService);

// @route   GET /api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', servicesController.getServiceById);

// @route   POST /api/services
// @desc    Create new service
// @access  Private (Admin or users with edit permission)
router.post('/', auth, servicesController.createService);

// @route   PUT /api/services/:id
// @desc    Update service
// @access  Private (Admin or users with edit permission)
router.put('/:id', auth, servicesController.updateService);

// @route   DELETE /api/services/:id
// @desc    Delete service
// @access  Private (Admin or users with delete permission)
router.delete('/:id', auth, servicesController.deleteService);

module.exports = router;
