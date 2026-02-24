// models/Rate.js
const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  productService: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", // Reference to Product/Service Master
    required: true 
  },

  supplier: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ManagedUser", // Reference to Supplier/Vendor Master
    required: true 
  },

  unit: { 
    type: String, 
    required: true,
    trim: true 
  }, // Example: Each, Box, Pack

  rate: { 
    type: Number, 
    required: true 
  }, // Price per unit

  remarks: { 
    type: String, 
    trim: true 
  },

  status: { 
    type: Boolean, 
    default: true 
  } // Active / Inactive
}, { timestamps: true });

module.exports = mongoose.model("Rate", rateSchema, "rates");
