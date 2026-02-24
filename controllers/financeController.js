const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Account = require('../models/Account');
const PayType = require('../models/PayType');
const Purchase = require('../models/Purchase');
const SalesBill = require('../models/SalesBill');
const Product = require('../models/Product');
const Patient = require('../models/Patient');
const ManagedUser = require('../models/ManagedUser');

/* ------------------- EXPENSE CATEGORY ------------------- */
exports.getExpenseCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createExpenseCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = new ExpenseCategory({ name });
    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.updateExpenseCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await ExpenseCategory.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.deleteExpenseCategory = async (req, res) => {
  try {
    const category = await ExpenseCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/* ------------------- ACCOUNT ------------------- */
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find();
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createAccount = async (req, res) => {
  try {
    const { accountName, accountNumber, remarks } = req.body;
    const account = new Account({ accountName, accountNumber, remarks });
    await account.save();
    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.updateAccount = async (req, res) => {
  try {
    const { accountName, accountNumber, remarks } = req.body;
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { accountName, accountNumber, remarks },
      { new: true }
    );
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findByIdAndDelete(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/* ------------------- EXPENSE ------------------- */
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('itemType', 'name')
      .populate('client', 'name')
      .populate('employee', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('itemType')
      .populate('client')
      .populate('employee');
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createExpense = async (req, res) => {
  try {
    const {
      date, expenseType, itemType, particulars, remarks, debit, credit,
      client, project, employee, salesBill, purchaseBill, tds,
      paymentMode, paymentSource, referenceNo, document
    } = req.body;

    const expense = new Expense({
      date, expenseType, itemType, particulars, remarks, debit, credit,
      client, project, employee, salesBill, purchaseBill, tds,
      paymentMode, paymentSource, referenceNo, document,
      createdBy: req.user?.id
    });

    await expense.save();
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const {
      date, expenseType, itemType, particulars, remarks, debit, credit,
      client, project, employee, salesBill, purchaseBill, tds,
      paymentMode, paymentSource, referenceNo, document
    } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        date, expenseType, itemType, particulars, remarks, debit, credit,
        client, project, employee, salesBill, purchaseBill, tds,
        paymentMode, paymentSource, referenceNo, document
      },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ------------PAYTYPE-----------------------------

exports.getPayTypes = async (req, res) => {
  try {
    const payTypes = await PayType.find();
    res.json({ success: true, data: payTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPayType = async (req, res) => {
  try {
    const { payType, deduction, status } = req.body;
    const newPayType = new PayType({ payType, deduction, status });
    await newPayType.save();
    res.status(201).json({ success: true, data: newPayType });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.createPayTypeBulk = async (req, res) => {
  try {
    const { payType, deduction, old_id } = req.body;
    const newPayType = new PayType({ payType, deduction, old_id, status: true });
    await newPayType.save();
    res.status(201).json({ success: true, data: newPayType });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updatePayType = async (req, res) => {
  try {
    const { payType, deduction, status } = req.body;
    const updatedPayType = await PayType.findByIdAndUpdate(
      req.params.id,
      { payType, deduction, status },
      { new: true }
    );
    if (!updatedPayType) {
      return res.status(404).json({ success: false, message: 'PayType not found' });
    }
    res.json({ success: true, data: updatedPayType });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deletePayType = async (req, res) => {
  try {
    const payType = await PayType.findByIdAndDelete(req.params.id);
    if (!payType) {
      return res.status(404).json({ success: false, message: 'PayType not found' });
    }
    res.json({ success: true, message: 'PayType deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.togglePayTypeStatus = async (req, res) => {
  try {
    const payType = await PayType.findById(req.params.id);
    if (!payType) {
      return res.status(404).json({ success: false, message: 'PayType not found' });
    }
    payType.status = !payType.status;
    await payType.save();
    res.json({ success: true, data: payType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getTopSellingProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100  } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Product sales statistics
    const productSales = await SalesBill.aggregate([
      ...(Object.keys(dateFilter).length ? [{ $match: { billDate: dateFilter } }] : []),
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $match: { 'productInfo.type': 'Product' } },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$productInfo.productName' },
          totalQuantitySold: { $sum: '$items.qty' },
          totalRevenue: { $sum: '$items.total' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get all products for comparison
    const allProducts = await Product.find({ type: 'Product' }, 'productName').lean();
    
    // Create product sales summary with all products
    const productSalesSummary = allProducts.map(product => {
      const salesData = productSales.find(sale => sale._id.toString() === product._id.toString());
      return {
        productId: product._id,
        productName: product.productName,
        totalQuantitySold: salesData?.totalQuantitySold || 0,
        totalRevenue: salesData?.totalRevenue || 0,
        totalOrders: salesData?.totalOrders || 0
      };
    });

    res.json({
      success: true,
      data: {
        topProducts: productSales,
        summary: productSalesSummary.sort((a, b) => b.totalRevenue - a.totalRevenue)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Total Sales
    const totalSales = await SalesBill.aggregate([
      ...(Object.keys(dateFilter).length ? [{ $match: { billDate: dateFilter } }] : []),
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    // Total Purchases
    const totalPurchases = await Purchase.aggregate([
      ...(Object.keys(dateFilter).length ? [{ $match: { billDate: dateFilter } }] : []),
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    // Total Expenses
    const totalExpenses = await Expense.aggregate([
      ...(Object.keys(dateFilter).length ? [{ $match: { date: dateFilter } }] : []),
      { $group: { _id: null, total: { $sum: '$debit' } } }
    ]);

    // Today's Sales
    const todaySales = await SalesBill.aggregate([
      { $match: { billDate: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    // Today's Purchases
    const todayPurchases = await Purchase.aggregate([
      { $match: { billDate: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    // Last 12 months sales
    const monthlySales = await SalesBill.aggregate([
      { $match: { billDate: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' }
          },
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Last 12 months purchases
    const monthlyPurchases = await Purchase.aggregate([
      { $match: { billDate: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$billDate' },
            month: { $month: '$billDate' }
          },
          total: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Expenses by category
    const expensesByCategory = await Expense.aggregate([
      ...(Object.keys(dateFilter).length ? [{ $match: { date: dateFilter } }] : []),
      {
        $lookup: {
          from: 'expense_categories',
          localField: 'itemType',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $group: {
          _id: '$itemType',
          categoryName: { $first: { $arrayElemAt: ['$category.name', 0] } },
          total: { $sum: '$debit' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Expenses by payment mode
    const expensesByPaymentMode = await Expense.aggregate([
      ...(Object.keys(dateFilter).length ? [{ $match: { date: dateFilter } }] : []),
      {
        $lookup: {
          from: 'paytypes',
          localField: 'paymentMode',
          foreignField: '_id',
          as: 'payType'
        }
      },
      {
        $group: {
          _id: '$paymentMode',
          paymentType: { $first: { $arrayElemAt: ['$payType.payType', 0] } },
          total: { $sum: '$debit' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Service sales statistics
    const serviceSales = await SalesBill.aggregate([
      ...(Object.keys(dateFilter).length ? [{ $match: { billDate: dateFilter } }] : []),
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $match: { 'productInfo.type': 'Service' } },
      {
        $group: {
          _id: '$items.product',
          serviceName: { $first: '$productInfo.productName' },
          totalQuantitySold: { $sum: '$items.qty' },
          totalRevenue: { $sum: '$items.total' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalQuantitySold: -1 } }
    ]);

    // Get all services for comparison
    const allServices = await Product.find({ type: 'Service' }, 'productName').lean();
    
    // Create service sales summary with all services
    const serviceSalesSummary = allServices.map(service => {
      const salesData = serviceSales.find(sale => sale._id.toString() === service._id.toString());
      return {
        serviceId: service._id,
        serviceName: service.productName,
        totalQuantitySold: salesData?.totalQuantitySold || 0,
        totalRevenue: salesData?.totalRevenue || 0,
        totalOrders: salesData?.totalOrders || 0
      };
    });

    // Count totals
    const [totalProducts, totalServices, totalPatients, totalSuppliers, totalEmployees,
           todayPatients, todayProducts, todayServices, todaySuppliers, todayEmployees] = await Promise.all([
      Product.countDocuments({ type: 'Product' }),
      Product.countDocuments({ type: 'Service' }),
      Patient.countDocuments(),
      ManagedUser.countDocuments({ role: { $in: ['supplier', 'vendor'] } }),
      ManagedUser.countDocuments({ role: { $nin: ['admin', 'subadmin', 'supplier', 'vendor'] } }),
      Patient.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Product.countDocuments({ type: 'Product', createdAt: { $gte: today, $lt: tomorrow } }),
      Product.countDocuments({ type: 'Service', createdAt: { $gte: today, $lt: tomorrow } }),
      ManagedUser.countDocuments({ role: { $in: ['supplier', 'vendor'] }, createdAt: { $gte: today, $lt: tomorrow } }),
      ManagedUser.countDocuments({ role: { $nin: ['admin', 'subadmin', 'supplier', 'vendor'] }, createdAt: { $gte: today, $lt: tomorrow } })
    ]);

    const salesTotal = totalSales[0]?.total || 0;
    const purchaseTotal = totalPurchases[0]?.total || 0;
    const expenseTotal = totalExpenses[0]?.total || 0;

    const totalIncome = salesTotal;
    const totalCost =  expenseTotal; // in expenses , i have already purchases data
    const netResult = totalIncome - totalCost;
    const totalProfit = netResult > 0 ? netResult : 0;
    const totalLoss = netResult < 0 ? Math.abs(netResult) : 0;

    res.json({
      success: true,
      data: {
        financials: {
          totalSales: salesTotal,
          totalPurchases: purchaseTotal,
          totalExpenses: expenseTotal,
          totalIncome: totalIncome,
          totalProfit: totalProfit,
          totalLoss: totalLoss,
          todaySales: todaySales[0]?.total || 0,
          todayPurchases: todayPurchases[0]?.total || 0
        },
        charts: {
          monthlySales,
          monthlyPurchases,
          expensesByCategory,
          expensesByPaymentMode
        },
        serviceSales: {
          summary: serviceSalesSummary,
          topServices: serviceSales.slice(0, 10) // Top 10 services by quantity sold
        },
        counts: {
          totalProducts,
          totalServices,
          totalPatients,
          totalSuppliers,
          totalEmployees
        },
        todayCounts: {
          todayPatients,
          todayProducts,
          todayServices,
          todaySuppliers,
          todayEmployees
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get sales summary with GST breakdown
exports.getSalesSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    const salesSummary = await SalesBill.aggregate([
      ...(Object.keys(dateFilter).length ? [{ $match: { billDate: dateFilter } }] : []),
      {
        $group: {
          _id: null,
          totalSellingAmount: { $sum: '$grandTotal' },
          totalGSTCollected: { $sum: { $add: ['$cgst', '$sgst', '$igst'] } },
          totalAmountWithoutGST: { $sum: '$totalProductAmount' },
          totalCGST: { $sum: '$cgst' },
          totalSGST: { $sum: '$sgst' },
          totalIGST: { $sum: '$igst' },
          totalDiscount: { 
            $sum: {
              $cond: {
                if: { $eq: ['$discountType', 'fixed'] },
                then: '$discountValue',
                else: {
                  $multiply: [
                    { $add: ['$totalProductAmount', '$cgst', '$sgst', '$igst'] },
                    { $divide: [{ $ifNull: ['$discountValue', 0] }, 100] }
                  ]
                }
              }
            }
          },
          totalBills: { $sum: 1 },
          totalPaidAmount: { $sum: '$paidAmount' },
          totalPendingAmount: { $sum: '$pendingAmount' }
        }
      }
    ]);

    const summary = salesSummary[0] || {
      totalSellingAmount: 0,
      totalGSTCollected: 0,
      totalAmountWithoutGST: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      totalDiscount: 0,
      totalBills: 0,
      totalPaidAmount: 0,
      totalPendingAmount: 0
    };

    res.json({
      success: true,
      data: {
        totalSellingAmount: summary.totalSellingAmount,
        totalGSTCollected: summary.totalGSTCollected,
        totalAmountWithoutGST: summary.totalAmountWithoutGST,
        gstBreakdown: {
          cgst: summary.totalCGST,
          sgst: summary.totalSGST,
          igst: summary.totalIGST
        },
        totalDiscount: summary.totalDiscount,
        totalBills: summary.totalBills,
        paymentStatus: {
          totalPaidAmount: summary.totalPaidAmount,
          totalPendingAmount: summary.totalPendingAmount
        },
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};