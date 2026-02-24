const mongoose = require('mongoose');

const bloodReportSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    patientName: String,
    fileUrl: String,
    fileName: String,
    uploadedBy: String,
    uploadedById: String,
    createdAt: Date,
    deletedAt: Date
});

module.exports = mongoose.model('BloodReport', bloodReportSchema, 'blood_reports');
