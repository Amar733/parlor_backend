// models/Account.js
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  accountName: { type: String, required: true, unique: true }, // e.g., SBI Main, HDFC Current
  accountNumber: { type: String, required: true, unique: true }, // e.g., 123456789
  remarks: { type: String }, // Additional info
  status: { type: Boolean, default: true } // Active/Inactive
}, { timestamps: true });

module.exports = mongoose.model("Account", accountSchema, "accounts");
