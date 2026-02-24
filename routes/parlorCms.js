const express = require('express');
const router = express.Router();
const parlorCmsController = require('../controllers/parlorCmsController');

// Get all CMS content
router.get('/', parlorCmsController.getAllCMSContent);

// Get all sections for a specific page
router.get('/:page', parlorCmsController.getPageSections);

// Get specific section content
router.get('/:page/:section', parlorCmsController.getSectionContent);

// Update specific section content
router.put('/:page/:section', parlorCmsController.updateSectionContent);

// Method not allowed for POST and DELETE
router.post('/:page/:section', parlorCmsController.methodNotAllowed);
router.delete('/:page/:section', parlorCmsController.methodNotAllowed);

module.exports = router;