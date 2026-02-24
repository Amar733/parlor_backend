const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    actions: [{ type: String, enum: ['view', 'edit', 'delete'] }]
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema, 'permissions');
