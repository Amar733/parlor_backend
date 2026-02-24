const express = require('express');
const { auth } = require('../middleware/auth');
const actionsController = require('../controllers/actionsController');
const router = express.Router();

// @route   POST /api/actions/generate-summary
// @desc    Generate daily summary for doctors/clinic
// @access  Private (Admin or Doctor)
router.post('/generate-summary', auth, actionsController.generateSummary);

// @route   POST /api/actions/improve-text
// @desc    Improve text using AI
// @access  Private (Protected by middleware)
router.post('/improve-text', auth, actionsController.improveText);

module.exports = router;





