const mongoose = require('mongoose');

const bloodTestSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: true,
        trim: true
    },
    testType: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    results: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for better query performance
bloodTestSchema.index({ patientName: 1 });
bloodTestSchema.index({ testType: 1 });
bloodTestSchema.index({ date: -1 });
bloodTestSchema.index({ status: 1 });

// Instance methods
bloodTestSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
};

// Static methods
bloodTestSchema.statics.findByPatient = function (patientName) {
    return this.find({ patientName: new RegExp(patientName, 'i') }).sort({ date: -1 });
};

bloodTestSchema.statics.findByStatus = function (status) {
    return this.find({ status }).sort({ date: -1 });
};

bloodTestSchema.statics.findByDateRange = function (startDate, endDate) {
    return this.find({
        date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    }).sort({ date: -1 });
};

const BloodTest = mongoose.model('BloodTest', bloodTestSchema);

module.exports = BloodTest;
