// models/PayType.js
const mongoose = require("mongoose");

const payTypeSchema = new mongoose.Schema({
  payType: { type: String, required: true, unique: true}, // e.g., Cash, Cheque, Credit Card
     old_id :{ type: String,default:""}, 
  deduction: { type: Number, default: 0 }, // Deduction in percentage
  status: { type: Boolean, default: true } // Active or Inactive
}, { timestamps: true });

module.exports = mongoose.model("PayType", payTypeSchema, "payTypes");
