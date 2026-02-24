const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema({
    title: String,
    imageUrl: String,
}, { timestamps: true });

module.exports = mongoose.model('PortfolioItem', portfolioItemSchema, 'portfolio');
