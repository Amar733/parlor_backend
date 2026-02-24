const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    date: { type: String, required: true }, // Consider converting to `Date` if needed
    content: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Summary', summarySchema, 'summaries');
