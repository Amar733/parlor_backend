// models/Company.js
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  website: { type: String },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },

  taxName: { type: String, default: "GST" },
  tax: { type: Number, default: 0.0 },
  currency: { type: String, default: "₹" },
  gst: { type: String },

  billPrefix: { type: String },
  stateCode: { type: String },

  bankName: { type: String },
  accountNo: { type: String },
  ifsc: { type: String },
  beneficiaryName: { type: String },
  pan: { type: String },

  billStartNo: { type: Number, default: 1000 },
  bookingStartNo: { type: Number, default: 2000 },
  workOrderStartNo: { type: Number, default: 3000 },
  quotationStartNo: { type: Number, default: 4000 },
  purchaseOrderStartNo: { type: Number, default: 70000 },

  aboutUs: { type: String },

  facebook: { type: String },
  twitter: { type: String },
  youtube: { type: String },
  instagram: { type: String },

  logo: { type: String }, // image url or base64
  signature: { type: String }, // image url or base64

  resetSalesBillCounter: { type: Boolean, default: true }, //Reset Sales Bill Counter after FY end
  resetPurchaseBillCounter: { type: Boolean, default: true }, //Reset Purchase Bill Counter after FY end
  resetBookingCounter: { type: Boolean, default: true } //Reset Booking Counter after FY end
}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);
