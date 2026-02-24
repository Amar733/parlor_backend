const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, 
    contactPerson: { type: String },
    phone: { type: String },
    email: { type: String },
  status: { type: Boolean, default: false }, 

    address: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema, 'stores');
