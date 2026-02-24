const express = require('express');
const { auth } = require('../middleware/auth');
const profileController = require('../controllers/profileController');
const router = express.Router();

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', auth, profileController.getProfile);

// @route   PUT /api/profile
// @desc    Update current user profile
// @access  Private

router.put('/', auth, profileController.updateProfile);

module.exports = router;
