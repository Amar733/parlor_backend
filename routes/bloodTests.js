const express = require('express');
const { auth } = require('../middleware/auth');
const bloodTestsController = require('../controllers/bloodTestsController');
const router = express.Router();

// @route   GET /api/blood-tests
// @desc    Get all blood tests
// @access  Private
router.get('/', auth, bloodTestsController.getAllBloodTests);

// @route   GET /api/blood-tests/:id
// @desc    Get blood test by ID
// @access  Private
router.get('/:id', auth, bloodTestsController.getBloodTestById);

// @route   POST /api/blood-tests
// @desc    Create new blood test
// @access  Private
router.post('/', auth, bloodTestsController.createBloodTest);

// @route   PUT /api/blood-tests/:id
// @desc    Update blood test
// @access  Private
router.put('/:id', auth, bloodTestsController.updateBloodTest);

// @route   DELETE /api/blood-tests/:id
// @desc    Delete blood test
// @access  Private
router.delete('/:id', auth, bloodTestsController.deleteBloodTest);

module.exports = router;
