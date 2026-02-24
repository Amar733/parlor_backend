const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const couponsController = require('../controllers/couponsController');
const router = express.Router();

// @route   GET /api/coupons
// @desc    Get all coupons
// @access  Public
router.get('/', couponsController.getAllCoupons);

// @route   GET /api/coupons/:id
// @desc    Get coupon by ID
// @access  Public
router.get('/:id', couponsController.getCouponById);

// @route   GET /api/coupons/validate/:code
// @desc    Validate coupon by code
// @access  Private
router.get('/validate/:code', auth, couponsController.validateCoupon);

// @route   POST /api/coupons
// @desc    Create new coupon
// @access  Private
router.post('/', auth, couponsController.createCoupon);

// @route   PUT /api/coupons/:id
// @desc    Update coupon
// @access  Private (Admin or users with edit permission)
router.put('/:id', auth, couponsController.updateCoupon);

// @route   DELETE /api/coupons/:id
// @desc    Delete coupon
// @access  Private (Admin or users with delete permission)
router.delete('/:id', auth, couponsController.deleteCoupon);

// @route   PATCH /api/coupons/:id/status
// @desc    Update coupon status
// @access  Private (Admin only)
router.patch('/:id/status', auth, authorize('admin'), couponsController.updateCouponStatus);

module.exports = router;
