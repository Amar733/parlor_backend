const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const permissionsController = require('../controllers/permissionsController');
const router = express.Router();

// @route   GET /api/permissions
// @desc    Get all permissions
// @access  Private (Admin only)
router.get('/', auth, authorize('admin'), permissionsController.getAllPermissions);

// @route   GET /api/permissions/:id
// @desc    Get permission by ID
// @access  Private (Admin only)
router.get('/:id', auth, authorize('admin'), permissionsController.getPermissionById);

// @route   POST /api/permissions
// @desc    Create new permission
// @access  Private (Admin only)
router.post('/', auth, authorize('admin'), permissionsController.createPermission);

// @route   PUT /api/permissions/:id
// @desc    Update permission
// @access  Private (Admin only)
router.put('/:id', auth, authorize('admin'), permissionsController.updatePermission);

// @route   DELETE /api/permissions/:id
// @desc    Delete permission
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), permissionsController.deletePermission);

module.exports = router;
