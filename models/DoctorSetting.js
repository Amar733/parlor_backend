const mongoose = require('mongoose');

const doctorSettingSchema = new mongoose.Schema({
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManagedUser',
    required: true,
    unique: true
  },
  doctorName: {
    type: String,
    required: true,
    trim: true
  },
  degree: {
    type: String,
    required: true,
    trim: true
  },
  speciality: {
    type: String,
    required: true,
    trim: true
  },
  regNo: {
    type: String,
    required: true,
    trim: true
  },
  clinicName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  logo: {
    type: String,
    required: false,
    trim: true
  },
  templateTheme: {
    type: String,
    required: false,
    default: 'default',
    trim: true
  },
  signature: {
    type: String,
    required: false,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DoctorSetting', doctorSettingSchema, 'doctor_settings');