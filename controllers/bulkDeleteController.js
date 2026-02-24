const Purchase = require("../models/Purchase");
const SalesBill = require("../models/SalesBill");
const Appointment = require("../models/Appointment");
const Expense = require("../models/Expense");
const StockTransaction = require("../models/StockTransaction");
const LogService = require("../services/logService");
const Product = require("../models/Product");

exports.deleteAllRecords = async (req, res) => {
  try {
    // Check if user is admin
    // if (!req.user || req.user.role !== "admin") {
    //   return res.status(403).json({ message: "Unauthorized: Admins only" });
    // }

    const results = {};

    // Delete all purchases (includes embedded purchase items)
    const purchaseResult = await Purchase.deleteMany({});
    results.purchases = purchaseResult.deletedCount;

    // Delete all sales
    const salesResult = await SalesBill.deleteMany({});
    results.sales = salesResult.deletedCount;

    // Delete all appointments
    // const appointmentResult = await Appointment.deleteMany({});
    // results.appointments = appointmentResult.deletedCount;

    // Delete all expenses
    const expenseResult = await Expense.deleteMany({});
    results.expenses = expenseResult.deletedCount;

    // Delete all stock transactions
    const stockResult = await StockTransaction.deleteMany({});
    results.stockTransactions = stockResult.deletedCount;

    // Delete all product transactions
      const productResult = await Product.deleteMany({});
    results.productTransactions = productResult.deletedCount;

    // Log the bulk delete activity
    await LogService.logActivity({
      actor: req.user,
      action: "BULK_DELETE_ALL",
      entity: {
        type: "Multiple",
        id: "bulk_delete",
        name: "All Records"
      },
      details: {
        deletedCounts: results
      },
      request: req,
    });

    res.json({
      message: "All records deleted successfully",
      deletedCounts: results,
      totalDeleted: Object.values(results).reduce((sum, count) => sum + count, 0)
    });

  } catch (error) {
    console.error("Error in bulk delete:", error);
    res.status(500).json({ message: "Error deleting records", error: error.message });
  }
};