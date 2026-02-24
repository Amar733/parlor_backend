const express = require('express');
const Summary = require('../models/Summary');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

const summariesController = require('../controllers/summariesController');
// @route   GET /api/summaries
// @desc    Get summaries (admin gets all, doctors get their own)
// @access  Private
router.get('/', auth, summariesController.getSummaries);

// @route   GET /api/summaries/:id
// @desc    Get summary by ID
// @access  Private
router.get('/:id', auth, summariesController.getSummaryById);

// @route   POST /api/summaries
// @desc    Create new summary
// @access  Private
router.post('/', auth, summariesController.createSummary);

// @route   PUT /api/summaries/:id
// @desc    Update summary
// @access  Private
router.put('/:id', auth, summariesController.updateSummary);

// @route   DELETE /api/summaries/:id
// @desc    Delete summary
// @access  Private
router.delete('/:id', auth, summariesController.deleteSummary);

// @route   GET /api/summaries/user/:userId
// @desc    Get summaries by user ID
// @access  Private
router.get('/user/:userId', auth, summariesController.getSummariesByUserId);

module.exports = router;
