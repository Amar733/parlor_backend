// models/Expense.js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },

  expenseType: { 
    type: String, 
    enum: ["personal", "official"], 
    required: true 
  },

  // Reference to Expense Category
  itemType: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ExpenseCategory", 
    default: null },

  particulars: { 
    type: String, 
    trim: true 
  },

  remarks: { 
    type: String, 
    trim: true 
  },

  debit: { 
    type: Number, 
    default: 0 
  }, // Expense Amount

  credit: { 
    type: Number, 
    default: 0 
  }, // Advance / Credit

  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ManagedUser" ,
    default: null
  },

  project: { 
    type: String, 
    default: "" 
  },
    file: { 
    type: String, 
    default: "" 
  },

  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ManagedUser",
    default: null
  },

  salesBill: { 
    type: String, 
    trim: true ,
    default: ""
  },

  purchaseBill: { 
    type: String, 
    trim: true ,
    default: ""
  },

  tds: { 
    type: Number, 
    default: 0 
  },

  paymentMode: { 
    type: mongoose.Schema.Types.ObjectId,  
    ref: "PayType",
    default: null
  },

  paymentSource: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Account",
    default: null
  }, // Example: Account ID / Bank Name

  referenceNo: { 
    type: String, 
    default: ""
  },

  document: { 
    type: String,
    default: ""
  }, // File path or URL for uploaded doc

  status: { 
    type: Boolean, 
    default: true 
  } // Active / Inactive
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema, "expenses");
