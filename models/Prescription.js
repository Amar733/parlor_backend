const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  medicine: { type: String, required: false },
  dose: { type: String, required: false },
  intake: { type: String, required: false },
  timing: { type: String, required: false },
  duration: { type: String, required: false }
});

const prescriptionSchema = new mongoose.Schema({
  visitDate: { type: Date, required: false, default: Date.now },

  // Patient Information
  patient: {
    name: { type: String, required: false },
    age: { type: String, required: false },
    sex: { type: String, required: false },
    weight: { type: String, default: '' },
    bp: { type: String, default: '' },
    contact: { type: String, required: false },
    address: { type: String, default: '' }
  },

  // Doctor/Clinic Information
  doctor: {
    name: { type: String, required: true },
    degree: { type: String, default: '' },
    speciality: { type: String, default: '' },
    regNo: { type: String, default: '' },
    clinicName: { type: String, default: '' },
    contact: { type: String, default: '' }
  },

  // Clinical Notes
  notes: {
    chiefComplaints: { type: String, default: '' },
    diagnosis: { type: String, default: '' },
    pastHistory: { type: String, default: '' },
    allergies: { type: String, default: '' },
    investigations: { type: String, default: '' },
    doctorNotes: { type: String, default: '' },
    advice: { type: String, default: '' },
    followUp: { type: String, default: '' }
  },
  templateTheme: { type: String, default: "" },
  // Medications List
  medications: [medicationSchema],

  // Canvas Drawing Data
  canvasData: { type: String, default: '' },
  canvasPages: [{
    pageId: { type: String },
    canvasData: { type: String, default: '' },
    text: { type: String, default: '' }
  }],

  // References for linking
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser', required: true },

  // Legacy fields for backward compatibility
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  uploadedBy: { type: String, default: '' },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema, 'prescriptions');