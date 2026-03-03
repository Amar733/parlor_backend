const mongoose = require('mongoose');

const doctorEarningSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManagedUser',
    required: true,
    unique: true
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  withdrawableBalance: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  lastTransactionAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('DoctorEarning', doctorEarningSchema);
