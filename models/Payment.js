const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String },
  signature: { type: String },
  amount: { type: Number, required: true }, // Total amount in paise (as per Razorpay)
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'captured', 'failed', 'refunded'],
    default: 'pending'
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }, // Optional for registration
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser' }, // Optional for registration
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  // New fields for Registration Payments
  type: { 
    type: String, 
    enum: ['appointment', 'registration'], 
    default: 'appointment' 
  },
  payerDetails: {
    name: String,
    email: String,
    contact: String
  },
  feePackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utility' },
  method: { type: String }, // upi, card, etc.
  description: { type: String },
  notes: { type: Map, of: String },
  refunds: [{
    refundId: String,
    amount: Number,
    status: String,
    createdAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema, 'payments');
