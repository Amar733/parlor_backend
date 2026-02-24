const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    clientName: String,
    text: String,
    avatarUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema, 'testimonials');
