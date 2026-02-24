const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();
const prescriptionSettingsController = require('../controllers/prescriptionSettingsController');

// @route   GET /api/prescription-settings
// @desc    Get prescription settings for authenticated doctor
// @access  Private
router.get('/', auth, prescriptionSettingsController.getSettings);

// @route   POST /api/prescription-settings
// @desc    Create prescription settings
// @access  Private
// router.post('/', auth, prescriptionSettingsController.createSettings);

// @route   PUT /api/prescription-settings
// @desc    Update prescription settings
// @access  Private
router.put('/', auth, prescriptionSettingsController.updateSettings);

// @route   DELETE /api/prescription-settings
// @desc    Delete prescription settings (reset to defaults)
// @access  Private
router.delete('/', auth, prescriptionSettingsController.deleteSettings);

module.exports = router;
