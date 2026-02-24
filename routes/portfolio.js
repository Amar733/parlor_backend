const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const portfolioController = require('../controllers/portfolioController');
const router = express.Router();

// @route   GET /api/portfolio
// @desc    Get all portfolio items
// @access  Public
router.get('/', portfolioController.getAllPortfolioItems);

// @route   GET /api/portfolio/:id
// @desc    Get portfolio item by ID
// @access  Public
router.get('/:id', portfolioController.getPortfolioItemById);

// @route   POST /api/portfolio
// @desc    Create new portfolio item
// @access  Public (no auth required like your Next.js version)
router.post('/', upload.single('image'), portfolioController.createPortfolioItem);

// @route   PUT /api/portfolio/:id
// @desc    Update portfolio item
// @access  Private (Admin or users with edit permission)
router.put('/:id', auth, upload.single('image'), portfolioController.updatePortfolioItem);

// @route   DELETE /api/portfolio/:id
// @desc    Delete portfolio item
// @access  Private (Admin or users with delete permission)
router.delete('/:id', auth, portfolioController.deletePortfolioItem);

module.exports = router;
