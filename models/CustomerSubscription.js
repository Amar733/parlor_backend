const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentMode: { type: mongoose.Schema.Types.ObjectId, ref: "PayType", required: true },
  amount: { type: Number, required: true }
});

const installmentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
  paidDate: { type: Date },
  paymentMode: { type: mongoose.Schema.Types.ObjectId, ref: "PayType" }
});

const firstInstallmentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentMode: { type: mongoose.Schema.Types.ObjectId, ref: "PayType", required: true },
  paidDate: { type: Date, required: true },
  status: { type: String, enum: ['paid'], default: 'paid' }
});

const customerSubscriptionSchema = new mongoose.Schema({
  billNo: { type: String, unique: true },
  billDate: { type: Date, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  packageTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser', required: true },
  
  grandTotal: { type: Number, required: true },
  billAmount: { type: Number, required: true }, // First payment amount
  paymentType: { type: String, enum: ['full', 'installment'], required: true },
  
  paymentMode: [paymentSchema], // For blended payments
  
  firstInstallment: firstInstallmentSchema,
  installments: [installmentSchema],
  
  status: { type: String, enum: ['pending', 'partial', 'paid', 'cancelled'], default: 'pending' },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser' }
}, { timestamps: true });

// Pre-save hook to auto-generate billNo
customerSubscriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.billNo) {
    try {
      const currentYear = new Date().getFullYear();
      const lastBill = await mongoose.model('CustomerSubscription').findOne({
        billNo: new RegExp(`^PKG-${currentYear}`)
      }).sort({ billNo: -1 });
      
      let nextCounter = 1;
      if (lastBill) {
        const lastCounter = parseInt(lastBill.billNo.split('-')[2]);
        nextCounter = lastCounter + 1;
      }
      
      this.billNo = `PKG-${currentYear}-${nextCounter.toString().padStart(3, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('CustomerSubscription', customerSubscriptionSchema, 'customer_subscriptions');