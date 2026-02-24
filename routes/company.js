const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { auth } = require('../middleware/auth');

// Get company
router.get('/', auth, companyController.getCompany);

// Update company (with image upload)
router.post('/', auth, companyController.updateCompany);

module.exports = router;