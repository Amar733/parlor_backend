const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    packageName: { type: String, required: true },
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],
    numberOfTimes: { type: Number, required: true, min: 1 },
    frequencyInDays: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    doctorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser' }],
    description: { type: String, default: '' },
    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'ManagedUser' }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema, 'packages');