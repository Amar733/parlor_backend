const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: String,
    discount: Number,
    discountType: { type: String, enum: ['percentage', 'fixed'] },
    expiryDate: String,
    status: { type: String, enum: ['Active', 'Expired'] }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema, 'coupons');
