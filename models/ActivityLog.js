const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    actor: {
        id: { type: String, required: true },
        name: { type: String, required: true },
    },
    action: { type: String, required: true },
    entity: {
        type: { type: String, required: true },
        id: { type: String, required: true },
        name: String,
    },
    details: { type: mongoose.Schema.Types.Mixed },
    request: {
        ip: String,
        userAgent: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema, 'activity_logs');
