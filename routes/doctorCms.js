const express = require('express');
const router = express.Router();
const doctorCmsController = require('../controllers/doctorCmsController');

// Get all CMS content for a doctor
router.get('/:doctor_id', doctorCmsController.getAllCMSContent);

// Get all sections for a specific page and doctor
router.get('/:doctor_id/:page', doctorCmsController.getPageSections);

// Get specific section content for a doctor
router.get('/:doctor_id/:page/:section', doctorCmsController.getSectionContent);

// Update specific section content for a doctor
router.put('/:doctor_id/:page/:section', doctorCmsController.updateSectionContent);

// Delete all CMS content
router.delete('/delete-all', doctorCmsController.deleteAllCMSContent);

// Method not allowed for POST and DELETE
router.post('/:doctor_id/:page/:section', doctorCmsController.methodNotAllowed);
router.delete('/:doctor_id/:page/:section', doctorCmsController.methodNotAllowed);

module.exports = router;