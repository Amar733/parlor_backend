// models/Purchase.js
const mongoose = require("mongoose");
const Company = require('./Company');

const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String }, // Store product name at time of purchase
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  subtotal: { type: Number, required: true }, // qty * rate
  cgstPercent: { type: Number, default: 0 },
  sgstPercent: { type: Number, default: 0 },
  igstPercent: { type: Number, default: 0 },
  total: { type: Number, required: true } // subtotal + taxes
});


const purchaseSchema = new mongoose.Schema({
  billNo: { type: String, unique: true }, // Auto generated or prefixed
  billDate: { type: Date, default: Date.now },
  vendorBillNo: { type: String },
  vendorBillDate: { type: Date },
    old_id :{ type: String,default:""}, 

  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "ManagedUser", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "ManagedUser", required: false },

  project: { type: String },

  items: [purchaseItemSchema], // Array of products/services
   
  totalProductAmount: { type: Number, default: 0.0 }, // before tax
  totalAmount: { type: Number, default: 0.0 }, // after tax
  cgst: { type: Number, default: 0.0 },
  sgst: { type: Number, default: 0.0 },
  igst: { type: Number, default: 0.0 },
  shippingCost: { type: Number, default: 0.0 },
  grandTotal: { type: Number, default: 0.0 },

  debitNoteAmount: { type: Number, default: 0.0 },
  paid: { type: Number, default: 0.0 },
  pending: { type: Number, default: 0.0 },
  tds: { type: Number, default: 0.0 },

  remarks: { type: String },
  summaryTerms: { type: String },

  uploadDocument: { type: String }, // store file path / URL

  status: { 
    type: String, 
    enum: ["due", "paid", "partial"], 
    default: "due" 
  }
}, { timestamps: true });

// Pre-save hook to auto-generate billNo
purchaseSchema.pre('save', async function(next) {
  console.log('Pre-save hook triggered. isNew:', this.isNew, 'billNo:', this.billNo);
  
  if (this.isNew && !this.billNo) {
    try {
      console.log('Starting billNo generation...');
      const currentYear = new Date().getFullYear();
      console.log('Current year:', currentYear);
      
      // Try to get company
      let company = await Company.findOne();
      console.log('Company found:', !!company);
      
      if (!company) {
        console.log('Creating new company...');
        company = await Company.create({ 
          companyName: 'Default Company',
          purchaseOrderStartNo: 70000
        });
        console.log('Company created:', company);
      }
      
      // Get current year's last purchase bill number
      const lastBill = await mongoose.model('Purchase').findOne({
        billNo: new RegExp(`^${currentYear}`)
      }).sort({ billNo: -1 });
      console.log('Last bill found:', lastBill?.billNo);
      
      let nextCounter;
      if (!lastBill || (company.resetPurchaseBillCounter && !lastBill.billNo.startsWith(currentYear.toString()))) {
        nextCounter = company.purchaseOrderStartNo || 70000;
        console.log('Using start counter:', nextCounter);
      } else {
        const lastCounter = parseInt(lastBill.billNo.substring(4));
        nextCounter = lastCounter + 1;
        console.log('Incrementing counter from', lastCounter, 'to', nextCounter);
      }
      
      this.billNo = `${currentYear}${nextCounter}`;
      console.log('Generated billNo:', this.billNo);
      
    } catch (error) {
      console.error('Error in pre-save hook:', error);
      return next(error);
    }
  }

  
  // Ensure billNo is always present
  if (!this.billNo) {
    return next(new Error('Failed to generate billNo'));
  }
  
  next();
});

module.exports = mongoose.model("Purchase", purchaseSchema, "purchases");
