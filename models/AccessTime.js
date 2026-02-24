const mongoose = require('mongoose');

const accessTimeSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    pageName: {
        type: String,
        required: true
    },
    openTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    closeTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata'
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    allowWeekends: {
        type: Boolean,
        default: true
    },
    daysOfWeek: {
        type: [Number],
        default: [0, 1, 2, 3, 4, 5, 6],
        validate: {
            validator: function (arr) {
                return arr.every(day => day >= 0 && day <= 6);
            },
            message: 'Days of week must be between 0 (Sunday) and 6 (Saturday)'
        }
    },
    breakTimes: [{
        startTime: {
            type: String,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        endTime: {
            type: String,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        reason: String
    }],
    holidays: [{
        date: {
            type: String,
            match: /^\d{4}-\d{2}-\d{2}$/
        },
        reason: String
    }],
    gracePeriodMinutes: {
        type: Number,
        default: 0,
        min: 0,
        max: 60
    },
    overrideUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedUser'
    }],
    messages: {
        beforeOpen: {
            type: String,
            default: 'This page will open at {openTime}. Please wait.'
        },
        afterClose: {
            type: String,
            default: 'This page is closed. Operating hours: {openTime} - {closeTime}. Contact admin for access.'
        },
        onBreak: {
            type: String,
            default: 'System is on break until {endTime}.'
        },
        onHoliday: {
            type: String,
            default: 'System is closed today for {reason}.'
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedUser'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AccessTime', accessTimeSchema, 'access_times');
