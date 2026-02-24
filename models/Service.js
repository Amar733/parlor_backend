const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    doctor_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedUser'
    }],
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Create index for doctor_ids
serviceSchema.index({ doctor_ids: 1 });

// Static method to find services by doctor
serviceSchema.statics.findByDoctor = function(doctorId) {
    return this.find({ doctor_ids: doctorId });
};

module.exports = mongoose.model('Service', serviceSchema, 'services');
