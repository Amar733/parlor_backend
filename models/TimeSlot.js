const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedUser',
        default: null // null for master slots
    },
    isMaster: {
        type: Boolean,
        default: false
    },
    masterSlots: [{
        type: String,
        required: function() { return this.isMaster; },
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }],
    // Global capacity for all time slots for this doctor
    patientsPerSlot: {
        type: mongoose.Schema.Types.Mixed, // Changed to Mixed to support { inclinic: 1, online: 1 }
        default: 1
    },
    slots: {
        type: mongoose.Schema.Types.Mixed, // Changed to Mixed to support { inclinic: {...}, online: {...} }
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Ensure unique constraints
timeSlotSchema.index({ userId: 1 }, { 
    unique: true, 
    partialFilterExpression: { userId: { $ne: null } } 
});
timeSlotSchema.index({ isMaster: 1 }, { 
    unique: true, 
    partialFilterExpression: { isMaster: true } 
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
