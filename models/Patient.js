const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true, required: false },
  old_id: { type: String, default: "" },
  contact: { type: String, required: true, trim: true },
  age: { type: Number, min: 0, default: null },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
  address: { type: String, default: '' },
  is_primary: { type: Boolean, default: false },
  associated_with_mobile: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema, 'patients');