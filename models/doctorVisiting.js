const mongoose = require('mongoose');

const doctorVisitingSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser', required: false },
  chamber: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor_chamber', required: false },
//   doctor: { type: String, required: false },
  
  patientName: { type: String, default: '' },
  patientEmail: { type: String, default: '' },
  patientPhone: { type: String, default: '' },

  patientCity:{type:String, default:''},
  patientAge:{type:String, default:''},
  patientGender:{type:String, default:''},
  patientFile:{type:Array, default:[]},
  notes:{type:String, default:''},


//   deletedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('doctor_visiting', doctorVisitingSchema, 'doctorVisiting');




