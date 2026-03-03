const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Doctor ID or 'PLATFORM' (as String or specific ID)
  entityType: { type: String, enum: ['Doctor', 'Platform'], required: true },
  transactionType: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true }, // Amount in paise
  purpose: {
    type: String,
    enum: ['consultation', 'commission', 'refund', 'withdrawal', 'registration_fee'],
    required: true
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'referenceModel' },
  referenceModel: { type: String, enum: ['Payment', 'Appointment'], required: true },
  balanceAfter: { type: Number }, // Snapshot of balance after this transaction
  description: { type: String },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// Index for quick balance calculation and entity-wise history
ledgerSchema.index({ entityId: 1, createdAt: -1 });

module.exports = mongoose.model('Ledger', ledgerSchema, 'ledgers');
