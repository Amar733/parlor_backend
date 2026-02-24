const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const managedUserSchema = new mongoose.Schema(
  {
    // Existing fields
    name: String,
    email: { type: String, unique: true, default: '' }, // Email is unique and require
    role: String,
    avatarUrl: { type: String, required: false },
    old_id :{ type: String,default:""}, 
    permissions: { type: [String], default: [] },
    password: { type: String, required: false },
    specialization:  { type: String, default: "" },
    bio:  { type: String, default: "" },
    availableSlots: { type: [String], default: [] }, // []

    // New fields from Vendor/Supplier UI
      companyName:  { type: String, default: "" },   // Company Name
      phone: { type: String, default: "" },                         // Phone
    gstNumber: { type: String, default: "" },                     // GST Number
    pan: { type: String, default: "" },                           // PAN
    stateCode: { type: String, default: "" },                     // State Code
    creditDays: { type: Number, default: 0 },        // Credit Days
    creditLimit: { type: Number, default: 0 },       // Credit Limit
    openingBalance: { type: Number, default: 0 },    // Opening Balance
    address: { type: String, default: "" },                       // Address
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManagedUser", managedUserSchema, "users");
