const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();
const doctorSettingController = require('../controllers/doctorSettingController');

// @route   GET /api/doctor-settings
// @desc    Get all doctor settings
// @access  Private
router.get('/', auth, doctorSettingController.getDoctorSettings);


// @route   GET /api/doctor-settings/doctor/:doctorId
// @desc    Get doctor setting by doctor ID
// @access  Private
router.get('/doctor/:doctorId', auth, doctorSettingController.getDoctorSettingById);

// @route   POST /api/doctor-settings
// @desc    Create or update doctor setting
// @access  Private
router.post('/', auth, doctorSettingController.upsertDoctorSetting);

// @route   DELETE /api/doctor-settings/:id
// @desc    Delete doctor setting
// @access  Private
router.delete('/:id', auth, doctorSettingController.deleteDoctorSetting);

module.exports = router;