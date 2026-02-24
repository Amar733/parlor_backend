const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();
const accessTimeController = require('../controllers/accessTimeController');

// @route   GET /api/settings/access-time
// @desc    Get access time configuration and validate current access
// @access  Public (can be called without auth, but includes user check if authenticated)
router.get('/', accessTimeController.getAccessTime);

// @route   POST /api/settings/access-time
// @desc    Create or update access time configuration (upsert)
// @access  Private (requires authentication)
router.post('/', auth, accessTimeController.updateAccessTime);

// @route   GET /api/settings/access-time/check
// @desc    Check if current user has override access
// @access  Private (requires authentication)
router.get('/check', auth, accessTimeController.checkUserAccess);

module.exports = router;
