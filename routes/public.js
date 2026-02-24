const express = require('express');
const { rateLimits } = require('../middleware/security');
const publicController = require('../controllers/publicController');
const router = express.Router();

// @route   GET /api/public/doctors
// @desc    Get all doctors (public route) - secure public representation
// @access  Public
router.get('/doctors', rateLimits.public, publicController.getAllDoctors);

// @route   GET /api/public/doctors/:id
// @desc    Get doctor by ID (public route) - secure public representation
// @access  Public
router.get('/doctors/:id', rateLimits.public, publicController.getDoctorById);

// @route   GET /api/public/specializations
// @desc    Get all unique specializations
// @access  Public
router.get('/specializations', rateLimits.public, publicController.getAllSpecializations);

// @route   GET /api/public/meet-info/:linkId
// @desc    Get meeting info by link ID (public)
// @access  Public
router.get('/meet-info/:linkId', rateLimits.public, require('../controllers/appointmentsController').getMeetingByLink);

module.exports = router;
