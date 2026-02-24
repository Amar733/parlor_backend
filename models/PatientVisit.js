const mongoose = require('mongoose');

const patientVisitsSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: false },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser', required: false },
  referedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser', required: false },
  service: { type: String, required: false },
  doctor: { type: String, required: false },
  date: { type: String, required: false }, // Consider using Date type for better validation
  time: { type: String, required: false },
  fileUrl: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
    default: 'Confirmed'
  },
  notes: { type: String, default: '' },
  patientName: { type: String, default: '' },
  patientEmail: { type: String, default: '' },
  patientPhone: { type: String, default: '' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Appointment_patientVisit', patientVisitsSchema, 'patientVisits');




