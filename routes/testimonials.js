
const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const testimonialsController = require('../controllers/testimonialsController');
const router = express.Router();

// @route   GET /api/testimonials
// @desc    Get all testimonials
// @access  Public
router.get('/', testimonialsController.getAllTestimonials);

// @route   GET /api/testimonials/:id
// @desc    Get testimonial by ID
// @access  Public
router.get('/:id', testimonialsController.getTestimonialById);

// @route   POST /api/testimonials
// @desc    Create new testimonial
// @access  Public (no auth required like your Next.js version)
router.post('/', upload.single('avatar'), testimonialsController.createTestimonial);

// @route   PUT /api/testimonials/:id
// @desc    Update testimonial
// @access  Private (Admin or users with edit permission)
router.put('/:id', auth, upload.single('avatar'), testimonialsController.updateTestimonial);

// @route   DELETE /api/testimonials/:id
// @desc    Delete testimonial
// @access  Private (Admin or users with delete permission)
router.delete('/:id', auth, testimonialsController.deleteTestimonial);

module.exports = router;
