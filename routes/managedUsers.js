const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const managedUsersController = require('../controllers/managedUsersController');
const router = express.Router();

// @route   GET /api/users
// @desc    Get all managed users
// @access  Public
router.get('/', managedUsersController.getAllManagedUsers);

// @route   POST /api/users
// @desc    Create new managed user
// @access  Private (Admin or users with edit permission)
router.post('/', auth, upload.single('avatar'), managedUsersController.createManagedUser);
router.post('/bulk', upload.single('avatar'), managedUsersController.createManagedUserBulk);

// @route   GET /api/users/doctors
// @desc    Get all doctors
// @access  Private
router.get('/doctors', auth, managedUsersController.getDoctors);

// @route   GET /api/users/vendors
// @desc    Get all vendors
// @access  Private
router.get('/vendors', auth, managedUsersController.getVendors);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, managedUsersController.getManagedUserById);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or own profile)
router.put('/:id', auth, upload.single('avatar'), managedUsersController.updateManagedUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), managedUsersController.deleteManagedUser);

// @route   PATCH /api/users/:id/permissions
// @desc    Update user permissions
// @access  Private (Admin only)
router.patch('/:id/permissions', auth, authorize('admin'), managedUsersController.updateUserPermissions);

module.exports = router;