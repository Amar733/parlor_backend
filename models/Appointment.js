const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
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
  deletedAt: { type: Date, default: null },
  type: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  meeting: {
    channel: String,
    linkId: String,
    status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
    startedAt: Date,
    endedAt: Date,
    duration: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema, 'appointments');