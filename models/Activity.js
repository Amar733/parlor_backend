const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    videoUrl: {
        type: String,
        required: true,
        trim: true
    },
    thumbnailUrl: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Add indexes
activitySchema.index({ title: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ deletedAt: 1 });
activitySchema.index({ createdBy: 1 });

// Instance method to return activity without sensitive data
activitySchema.methods.toJSON = function () {
    const activity = this.toObject();
    return activity;
};

// Static method to find non-deleted activities
activitySchema.statics.findActive = function () {
    return this.find({ deletedAt: { $exists: false } });
};

// Static method to find deleted activities
activitySchema.statics.findDeleted = function () {
    return this.find({ deletedAt: { $exists: true } });
};

const Activity = mongoose.model('Activity', activitySchema, 'activities');

module.exports = Activity;

