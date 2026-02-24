// models/SalesBill.js
const mongoose = require("mongoose");
const Company = require('./Company');

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  subtotal: { type: Number, required: true }, // qty * rate
  cgstPercent: { type: Number, default: 0 },
  sgstPercent: { type: Number, default: 0 },
  igstPercent: { type: Number, default: 0 },
  is_igst: { type: Boolean, default: false },
  total: { type: Number, required: true } // subtotal + taxes
});

const paymentSchema = new mongoose.Schema({
  paymentMode: { type: mongoose.Schema.Types.ObjectId, ref: "PayType", required: true },
  amount: { type: Number, required: true }
});

const salesBillSchema = new mongoose.Schema({
  billNo: {
    type: String,
    unique: true,
  },
    old_id :{ type: String,default:""}, 

  billDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",   // Reference to Customer master
    required: true
  },

  project: {
    type: String, // Optional project reference
    default: ""
  },

  items: [saleItemSchema], // Array of products/services

  subtotal: { type: Number, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  discountValue: { type: Number, default: 0 },
  totalProductAmount: { type: Number, default: 0.0 }, // before tax

  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },

  grandTotal: { type: Number, required: true },

  paymentMode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PayType",   // Reference to Customer master
    required: false // Made optional for backward compatibility
  },

  paymentModes: [paymentSchema], // Array for blended payments

  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ["due", "paid", 'partially'],
    default: "due"
  },

  tds: { type: Number, default: 0 },

  remarks: { type: String, trim: true },
  terms: { type: String, trim: true },

  creditNoteAmount: { type: Number, default: 0 },

  uploadedDocs: [{ type: String }], // store file paths / URLs
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "ManagedUser", required: false },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ManagedUser"
  }
}, { timestamps: true });

// Pre-save hook to auto-generate billNo
salesBillSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const company = await Company.findOne() || await Company.create({ name: 'Default Company' });
      const currentYear = new Date().getFullYear();
      
      // Get current year's last bill number
      const lastBill = await mongoose.model('SalesBill').findOne({
        billNo: new RegExp(`^${currentYear}`)
      }).sort({ billNo: -1 });
      
      let nextCounter;
      if (!lastBill || (company.resetSalesBillCounter && !lastBill.billNo.startsWith(currentYear.toString()))) {
        // First bill of the year or reset needed
        nextCounter = company.billStartNo;
      } else {
        // Extract counter from last bill and increment
        const lastCounter = parseInt(lastBill.billNo.substring(4));
        nextCounter = lastCounter + 1;
      }
      
      this.billNo = `${currentYear}${nextCounter}`;
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("SalesBill", salesBillSchema, "sales_bills");
