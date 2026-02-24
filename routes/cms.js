
const express = require('express');
const { auth } = require('../middleware/auth');
const cmsController = require('../controllers/cmsController');
const router = express.Router();

// @route   GET /api/cms/:page/:section
// @desc    Read section content
// @access  Public
router.get('/:page/:section', cmsController.getSectionContent);

// @route   POST /api/cms/:page/:section
// @desc    Add new item to a section's data array (Method Not Allowed - Use PUT instead)
// @access  Private
router.post('/:page/:section', cmsController.methodNotAllowed);

// @route   PUT /api/cms/:page/:section
// @desc    Update an entire section's data
// @access  Private (Admin or users with CMS edit permission)
router.put('/:page/:section', auth, cmsController.updateSectionContent);

// @route   DELETE /api/cms/:page/:section
// @desc    Not typically used for section-level CMS (Method Not Allowed)
// @access  Private
router.delete('/:page/:section', cmsController.methodNotAllowed);

// @route   GET /api/cms/:page
// @desc    Get all sections for a page
// @access  Public
router.get('/:page', cmsController.getPageSections);

// @route   GET /api/cms
// @desc    Get all CMS content (for admin dashboard)
// @access  Private
router.get('/', auth, cmsController.getAllCMSContent);

module.exports = router;
