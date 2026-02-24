const mongoose = require('mongoose');

const chamberSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser', required: false },
  chamberName: { type: String, required: false },
  city: { type: String, required: false }, 
  contactPerson: { type: String, required: false },
  contactNumber: { type: String, required: false },
  
}, { timestamps: true });

module.exports = mongoose.model('doctor_chamber', chamberSchema, 'chamber');







