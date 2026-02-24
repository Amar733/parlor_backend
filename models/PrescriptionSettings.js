const mongoose = require('mongoose');

const prescriptionSettingsSchema = new mongoose.Schema({
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedUser',
        required: true,
        unique: true
    },
    headerColor: {
        type: String,
        required: true,
        default: '#0d9488'
    },
    logoShape: {
        type: String,
        enum: ['circle', 'square', 'none'],
        required: true,
        default: 'circle'
    },
    fontStyle: {
        type: String,
        required: true,
        default: 'system-ui, -apple-system, sans-serif'
    },
    fontSize: {
        type: Number,
        required: true,
        min: 80,
        max: 120,
        default: 100
    },
    textColor: {
        type: String,
        required: true,
        default: '#000000'
    }
}, { timestamps: true });

module.exports = mongoose.model('PrescriptionSettings', prescriptionSettingsSchema, 'prescription_settings');
