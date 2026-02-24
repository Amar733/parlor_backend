// models/ExpenseCategory.js
const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., Clinic Furniture Purchase
  status: { type: Boolean, default: true } // Active/Inactive
}, { timestamps: true });

module.exports = mongoose.model("ExpenseCategory", expenseCategorySchema, "expense_categories");
