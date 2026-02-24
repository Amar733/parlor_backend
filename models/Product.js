const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },          // Product Name
    
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false }, 
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: false },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    old_id :{ type: String,default:""}, 
    type: { type: String, enum: ['Product', 'Service'], default: 'Product' },
    mrp: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    hsnSac: { type: String, default: "" },
    barcode: { type: String, default: "" },
    batchNo: { type: String, default: "" },
    sku: { type: String, default: "" },
    minStockThreshold: { type: Number, default: 0 },
    taxType: {
    type: String,
    enum: ["Inclusive", "Exclusive"], // restrict values
    default: "Exclusive"
  },
    weight: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    length: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    status: { type: Boolean, default: false }, 
    description: { type: String, default: "" },
    photo: { type: String, default: "" },
    isShowcase: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema, 'products');
