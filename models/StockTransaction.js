// models/StockTransaction.js
const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Reference to Product/Service Master
    required: true
  },

  transactionType: {
    type: String,
    enum: ["IN", "OUT", "TRANSFER_IN", "TRANSFER_OUT"],
    required: true
  },

  qty: {
    type: Number,
    required: true
  },

  transactionDate: {
    type: Date,
    default: Date.now
  },

  reference: {
    type: String,
    trim: true
  },

  notes: {
    type: String,
    trim: true
  },

  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store", // Single store reference
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("StockTransaction", stockTransactionSchema, "stock_transactions");
