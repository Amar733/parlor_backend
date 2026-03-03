const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const managedUserSchema = new mongoose.Schema(
  {
    // Existing fields
    name: String,
    email: { type: String, unique: true, default: '' },
    mobileNo: { type: String, default: "" },
    userPhoto: { type: String, default: "" },
    parlorPhotos: { type: String, default: "" },
    establishmentYear: { type: String, default: "" },
    gender: { type: String, default: "" },
    services: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    businessLicense: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    panNumber: { type: String, default: "" },
    account_Number: { type: String, default: "" },
    ifsc_code: { type: String, default: "" },
    bank_name: { type: String, default: "" },
    register_fees: { type: String, default: "" },
    role: String,
    avatarUrl: { type: String, required: false },
    old_id: { type: String, default: "" },
    permissions: { type: [String], default: [] },
    password: { type: String, required: false },
    specialization: { type: String, default: "" },
    bio: { type: String, default: "" },
    availableSlots: { type: [String], default: [] },
    companyName: { type: String, default: "" },
    phone: { type: String, default: "" },
    pan: { type: String, default: "" },
    stateCode: { type: String, default: "" },
    creditDays: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    address: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ManagedUser", managedUserSchema, "users");
