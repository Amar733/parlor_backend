const mongoose = require("mongoose");


const brandSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g. Glenmark, Dermocare
    status: { type: Boolean, default: false }, 
        old_id :{ type: String,default:""}, 

}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema, 'brands');
