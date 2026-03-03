const mongoose = require('mongoose');

const doctorEarningSchema = new mongoose.Schema({
  parlorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser', required: true, unique: true },
  totalEarned: { type: Number, default: 0 }, // Lifetime earnings in paise
  totalCommission: { type: Number, default: 0 }, // Total commission paid to platform in paise
  totalWithdrawn: { type: Number, default: 0 }, // Total amount withdrawn by doctor
  withdrawableBalance: { type: Number, default: 0 }, // Current balance doctor can withdraw
  lastTransactionAt: { type: Date },
  pendingAmount: { type: Number, default: 0 } // Amount held (e.g., ongoing consultation)
}, { timestamps: true });

module.exports = mongoose.model('DoctorEarning', doctorEarningSchema, 'doctor_earnings');
