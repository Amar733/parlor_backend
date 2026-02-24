const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const StockTransaction = require('../models/StockTransaction');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Product = require('../models/Product');
const SalesBill = require('../models/SalesBill');
const Company = require('../models/Company');
const ActivityLog = require('../models/ActivityLog');


// Get all purchases
exports.getPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, vendor, status, doctorId, startDate, endDate, minAmount, maxAmount, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query object
    let query = {};
    
    // Search functionality
    if (search) {
      // First find products and categories that match the search
      const products = await Product.find({
        productName: { $regex: search, $options: 'i' }
      }).populate('category', 'categoryName');
      
      const categories = await mongoose.model('Category').find({
        categoryName: { $regex: search, $options: 'i' }
      });
      
      const productIds = products.map(p => p._id);
      const categoryProductIds = products.filter(p => 
        p.category && p.category.categoryName && 
        p.category.categoryName.toLowerCase().includes(search.toLowerCase())
      ).map(p => p._id);
      
      // Also find products that belong to matching categories
      const categoryIds = categories.map(c => c._id);
      const productsInCategories = await Product.find({
        category: { $in: categoryIds }
      });
      const categoryProductIds2 = productsInCategories.map(p => p._id);
      
      // Combine all product IDs
      const allProductIds = [...new Set([...productIds, ...categoryProductIds, ...categoryProductIds2])];
      
      query.$or = [
        { billNo: { $regex: search, $options: 'i' } },
        { vendorBillNo: { $regex: search, $options: 'i' } },
        { project: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } },
        { 'items.product': { $in: allProductIds } }
      ];
    }
    
    // Filter by vendor
    if (vendor) {
      query.vendor = vendor;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by doctorId
    if (doctorId) {
      query.doctorId = doctorId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.billDate = {};
      if (startDate) query.billDate.$gte = new Date(startDate);
      if (endDate) query.billDate.$lte = new Date(endDate);
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      query.grandTotal = {};
      if (minAmount) query.grandTotal.$gte = parseFloat(minAmount);
      if (maxAmount) query.grandTotal.$lte = parseFloat(maxAmount);
    }
    
    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const purchases = await Purchase.find(query)
      .populate('vendor', 'name email companyName')
      .populate('items.product', 'productName')
      .populate('items.store', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count for pagination
    const total = await Purchase.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: purchases,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get purchase by ID
exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('vendor')
      .populate('items.product')
      .populate('items.store');
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    res.json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create purchase
exports.createPurchase = async (req, res) => {
  try {
    const {
      vendorBillNo, vendorBillDate, vendor, project, items, totalAmount,doctorId,
     shippingCost, grandTotal, debitNoteAmount, paid,
      pending, tds, remarks, summaryTerms, uploadDocument, status
    } = req.body;
    
    // Calculate tax amounts from items
    const cgst = items.reduce((sum, item) => {
      const subtotal = parseFloat(item.subtotal) || 0;
      const cgstRate = parseFloat(item.cgstPercent) || 0;
      return sum + (subtotal * cgstRate / 100);
    }, 0);
    const sgst = items.reduce((sum, item) => {
      const subtotal = parseFloat(item.subtotal) || 0;
      const sgstRate = parseFloat(item.sgstPercent) || 0;
      return sum + (subtotal * sgstRate / 100);
    }, 0);
    const igst = items.reduce((sum, item) => {
      const subtotal = parseFloat(item.subtotal) || 0;
      const igstRate = parseFloat(item.igstPercent) || 0;
      return sum + (subtotal * igstRate / 100);
    }, 0); 
  // Calculate total product amount without tax
  const totalProductAmount = items.reduce((sum, item) => {
    return sum + (parseFloat(item.subtotal) || 0);
  }, 0);
    const purchase = new Purchase({
      vendorBillNo, vendorBillDate, vendor, project, items, totalAmount,doctorId,
      totalProductAmount,cgst, sgst, igst, shippingCost, grandTotal, debitNoteAmount, paid,
      pending, tds, remarks, summaryTerms, uploadDocument, status
    });
    
    await purchase.save();

     for (const item of purchase.items) {
        // Skip stock transactions for services
        if (item.product.type === 'Service') {
          continue;
        }
        
        await StockTransaction.create({
          product: item.product,
          transactionType: 'IN',
          qty: item.qty,
          reference: `Purchase Bill: ${purchase.billNo}`,
          store: item.store,
          createdBy: req.user?.id
        });
      }
    
    // Log activity
    await ActivityLog.create({
      actor: {
        id: req.user?._id?.toString() || 'system',
        name: req.user?.name || 'System'
      },
      action: 'CREATE_PURCHASE',
      entity: {
        type: 'Purchase',
        id: purchase._id.toString(),
        name: `Purchase Bill: ${purchase.billNo}`
      },
      details: {
        billNo: purchase.billNo,
        vendor: purchase.vendor,
        grandTotal: purchase.grandTotal,
        status: purchase.status
      },
      request: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });
    
    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.createPurchaseBills = async (req, res) => {
  try {
    const {
      vendorBillNo, vendorBillDate, vendor, project, items, totalAmount,
     shippingCost, grandTotal, debitNoteAmount, paid,
      pending, tds, remarks, summaryTerms, uploadDocument, status
    } = req.body;
    
    // Calculate tax amounts from items
    const cgst = items.reduce((sum, item) => {
      const subtotal = parseFloat(item.subtotal) || 0;
      const cgstRate = parseFloat(item.cgstPercent) || 0;
      return sum + (subtotal * cgstRate / 100);
    }, 0);
    const sgst = items.reduce((sum, item) => {
      const subtotal = parseFloat(item.subtotal) || 0;
      const sgstRate = parseFloat(item.sgstPercent) || 0;
      return sum + (subtotal * sgstRate / 100);
    }, 0);
    const igst = items.reduce((sum, item) => {
      const subtotal = parseFloat(item.subtotal) || 0;
      const igstRate = parseFloat(item.igstPercent) || 0;
      return sum + (subtotal * igstRate / 100);
    }, 0); 
  // Calculate total product amount without tax
  const totalProductAmount = items.reduce((sum, item) => {
    return sum + (parseFloat(item.subtotal) || 0);
  }, 0);
    // Map old_id to actual product _id
    const newItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findOne({ old_id: item.product });
      return {
        ...item,
        product: product ? product._id : item.product
      };
    }));
    
    const purchase = new Purchase({
      vendorBillNo, vendorBillDate, vendor, project, items: newItems, totalAmount,
      totalProductAmount,cgst, sgst, igst, shippingCost, grandTotal, debitNoteAmount, paid,
      pending, tds, remarks, summaryTerms, uploadDocument, status
    });
    
    await purchase.save();

    // Create stock transactions based on payment status
    if (status === 'paid') {
      for (const item of purchase.items) {
        // Skip stock transactions for services
        const productData = await Product.findById(item.product);
        if (productData && productData.type === 'Service') {
          continue;
        }
        
        await StockTransaction.create({
          product: item.product,
          transactionType: 'IN',
          qty: item.qty,
          reference: `Purchase Bill: ${purchase.billNo}`,
          store: item.store,
          createdBy: req.user?.id
        });
      }
    }
    
    // Create expense when status is paid
    if (status === 'paid') {
      const { expenseType, itemType, paymentMode, remarks, paymentSource } = req.body;
      await Expense.create({
        date: new Date(),
        expenseType: expenseType,
        client: purchase.vendor,
        itemType: itemType || null,
        particulars: `Purchase Bill Payment: ${purchase.billNo}`,
        debit: purchase.grandTotal,
        purchaseBill: purchase.billNo,
        paymentSource: paymentSource || null,
        paymentMode: paymentMode || null,
        createdBy: req.user?.id,
        remarks: remarks
      });
    }
    
    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// Update purchase with stock management
exports.updatePurchaseWithStockManagement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendorBillNo, vendorBillDate, vendor, project, items, totalAmount,
      shippingCost, grandTotal, debitNoteAmount, paid,
      pending, tds, remarks, summaryTerms, uploadDocument, status
    } = req.body;

    // Get existing purchase
    const existingPurchase = await Purchase.findById(id).populate('items.product');
    if (!existingPurchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    // Reverse previous stock transactions (remove from stock)
    for (const oldItem of existingPurchase.items) {
      const productData = await Product.findById(oldItem.product._id);
      if (productData && productData.type !== 'Service') {
        await StockTransaction.create({
          product: oldItem.product._id,
          transactionType: 'OUT',
          qty: oldItem.qty,
          reference: `Purchase Update Reversal: ${existingPurchase.billNo}`,
          store: oldItem.store,
          createdBy: req.user?.id
        });
      }
    }

    // Calculate tax amounts from new items
    let cgst = 0, sgst = 0, igst = 0, totalProductAmount = 0
    
    if (items && items.length > 0) {
      cgst = items.reduce((sum, item) => {
        const subtotal = parseFloat(item.subtotal) || 0;
        const cgstRate = parseFloat(item.cgstPercent) || 0;
        return sum + (subtotal * cgstRate / 100);
      }, 0);
      sgst = items.reduce((sum, item) => {
        const subtotal = parseFloat(item.subtotal) || 0;
        const sgstRate = parseFloat(item.sgstPercent) || 0;
        return sum + (subtotal * sgstRate / 100);
      }, 0);
      igst = items.reduce((sum, item) => {
        const subtotal = parseFloat(item.subtotal) || 0;
        const igstRate = parseFloat(item.igstPercent) || 0;
        return sum + (subtotal * igstRate / 100);
      }, 0);
      
      totalProductAmount = items.reduce((sum, item) => {
        return sum + (parseFloat(item.subtotal) || 0);
      }, 0);
      
    }

    // Prepare update data
    const updateData = {
      vendor, project, items,
      vendorBillNo, vendorBillDate,
      totalAmount: parseFloat(totalAmount) || 0,
      totalProductAmount, cgst, sgst, igst,
      shippingCost: parseFloat(shippingCost) || 0,
      grandTotal: parseFloat(grandTotal) || 0,
      debitNoteAmount: parseFloat(debitNoteAmount) || 0,
      paid: parseFloat(paid) || 0,
      pending: parseFloat(pending) || 0,
      tds: parseFloat(tds) || 0,
      status,
      remarks, summaryTerms, uploadDocument
    };

    // Add billDate if provided
    if (req.body.billDate) {
      updateData.billDate = new Date(req.body.billDate);
    }

    // Update the purchase
    const updatedPurchase = await Purchase.findByIdAndUpdate(id, updateData, { new: true });

    // Create new stock transactions (add to stock)
    if (items && items.length > 0) {
      for (const newItem of items) {
        const productData = await Product.findById(newItem.product);
        if (productData && productData.type !== 'Service') {
          await StockTransaction.create({
            product: newItem.product,
            transactionType: 'IN',
            qty: newItem.qty,
            reference: `Purchase Update: ${updatedPurchase.billNo}`,
            store: newItem.store,
            createdBy: req.user?.id
          });
        }
      }
    }

    // Log activity
    await ActivityLog.create({
      actor: {
        id: req.user?._id?.toString() || 'system',
        name: req.user?.name || 'System'
      },
      action: 'UPDATE_PURCHASE',
      entity: {
        type: 'Purchase',
        id: updatedPurchase._id.toString(),
        name: `Purchase Bill: ${updatedPurchase.billNo}`
      },
      details: {
        billNo: updatedPurchase.billNo,
        vendor: updatedPurchase.vendor,
        grandTotal: updatedPurchase.grandTotal,
        status: updatedPurchase.status
      },
      request: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ success: true, data: updatedPurchase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete purchase
exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('items.product');
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    
    // Prevent deletion of paid purchases
    if (purchase.status === 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete paid purchase.' 
      });
    }
    
  
      for (const item of purchase.items) {
        const productData = await Product.findById(item.product._id);
        if (productData && productData.type !== 'Service') {
          await StockTransaction.create({
            product: item.product._id,
            transactionType: 'OUT',
            qty: item.qty,
            reference: `Purchase Deletion: ${purchase.billNo}`,
            store: item.store,
            createdBy: req.user?.id
          });
        }
      }
    

    // Log the deletion activity
    await ActivityLog.create({
      actor: {
        id: req.user?._id?.toString() || 'system',
        name: req.user?.name || 'System'
      },
      action: 'DELETE_PURCHASE',
      entity: {
        type: 'Purchase',
        id: purchase._id.toString(),
        name: `Purchase Bill: ${purchase.billNo}`
      },
      details: {
        billNo: purchase.billNo,
        vendor: purchase.vendor,
        grandTotal: purchase.grandTotal,
        status: purchase.status,
        deletedItems: purchase.items.length
      },
      request: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });
    
    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Purchase deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete all purchase bills, expenses, and stock transactions
exports.deleteAllPurchaseData = async (req, res) => {
  try {
    await Purchase.deleteMany({});
    await Expense.deleteMany({});
    await SalesBill.deleteMany({});
    await StockTransaction.deleteMany({});
    res.json({ success: true, message: 'All purchase bills, expenses, and stock transactions deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, paid,expenseType,itemType,paymentMode,remarks,paymentSource } = req.body;
    const purchase = await Purchase.findById(req.params.id).populate('items.product');
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    
    if (purchase.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Purchase is already fully paid' });
    }
    
    purchase.status = status;
    // purchase.paid = paid;
    // purchase.pending = purchase.grandTotal - paid;
    
    
    
    
    // Create expense when status is paid
    if (status === 'paid') {
      // const firstCategory = await ExpenseCategory.findOne();
      await Expense.create({
        date: new Date(),
        expenseType: expenseType,
        client: purchase.vendor,
        itemType: itemType || null,
        particulars: `Purchase Bill Payment: ${purchase.billNo}`,
        debit: purchase.grandTotal,
        purchaseBill: purchase.billNo,
        paymentSource: paymentSource || null,
        paymentMode: paymentMode || null,
        createdBy: req.user?.id,
        remarks:remarks
      });
    }
    await purchase.save();
    
    // Log activity
    await ActivityLog.create({
      actor: {
        id: req.user?._id?.toString() || 'system',
        name: req.user?.name || 'System'
      },
      action: 'UPDATE_PAYMENT_STATUS',
      entity: {
        type: 'Purchase',
        id: purchase._id.toString(),
        name: `Purchase Bill: ${purchase.billNo}`
      },
      details: {
        billNo: purchase.billNo,
        oldStatus: 'due',
        newStatus: status,
        grandTotal: purchase.grandTotal
      },
      request: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });
    
    res.json({ success: true, data: purchase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Bulk payment update
exports.bulkUpdatePaymentStatus = async (req, res) => {
  try {
    const { billNumbers, status, expenseType,file, itemType, paymentMode, remarks, paymentSource } = req.body;
    
    if (!billNumbers || !Array.isArray(billNumbers) || billNumbers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'billNumbers array is required' 
      });
    }
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'status is required' 
      });
    }
    
    // Get all purchases with the provided bill numbers
    const purchases = await Purchase.find({ 
      billNo: { $in: billNumbers } 
    }).populate('items.product');
    
    if (purchases.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No purchases found for the provided bill numbers' 
      });
    }
    
    // Check if all purchases belong to the same vendor
    const uniqueVendors = [...new Set(purchases.map(p => p.vendor.toString()))];
    if (uniqueVendors.length > 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'All bill numbers must belong to the same vendor' 
      });
    }
    
    const updatedPurchases = [];
    const alreadyPaidBills = [];
    let totalAmount = 0;
    
    // Process each purchase
    for (const purchase of purchases) {
      if (purchase.status === 'paid') {
        alreadyPaidBills.push(purchase.billNo);
        continue;
      }
      
      purchase.status = status;
      totalAmount += purchase.grandTotal || 0;
      
      await purchase.save();
      updatedPurchases.push(purchase);
    }
    
    // Create single expense entry for all bills when status is paid
    if (status === 'paid' && updatedPurchases.length > 0) {
      const billNosString = updatedPurchases.map(p => p.billNo).join(', ');
      
      await Expense.create({
        date: new Date(),
        file: file || null,
        expenseType: expenseType,
        client: updatedPurchases[0].vendor,
        itemType: itemType || null,
        particulars: `Bulk Purchase Bill Payment: ${billNosString}`,
        debit: Math.round(totalAmount),
        purchaseBill: billNosString,
        paymentSource: paymentSource || null,
        paymentMode: paymentMode || null,
        createdBy: req.user?.id,
        remarks: remarks
      });
    }
    
    // Get bulk purchase details for response
    let bulkDetails = null;
    try {
      bulkDetails = await getBulkPurchaseDetailsHelper(billNumbers);
    } catch (error) {
      console.error('Error getting bulk details:', error);
    }
    
    // Log bulk activity
    if (updatedPurchases.length > 0) {
      await ActivityLog.create({
        actor: {
          id: req.user?._id?.toString() || 'system',
          name: req.user?.name || 'System'
        },
        action: 'BULK_UPDATE_PAYMENT_STATUS',
        entity: {
          type: 'Purchase',
          id: 'bulk',
          name: `Bulk Payment Update: ${updatedPurchases.length} bills`
        },
        details: {
          billNumbers: updatedPurchases.map(p => p.billNo),
          newStatus: status,
          totalAmount: Math.round(totalAmount),
          updatedCount: updatedPurchases.length
        },
        request: {
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent')
        }
      });
    }

    res.json({ 
      success: true, 
      data: {
        paymentUpdate: {
          updatedPurchases: updatedPurchases.length,
          alreadyPaidBills,
          totalAmount: Math.round(totalAmount),
          processedBills: updatedPurchases.map(p => p.billNo)
        },
        purchaseDetails: bulkDetails
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
exports.generatePurchaseInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get purchase bill with populated data
    const purchase = await Purchase.findById(id)
      .populate('vendor')
      .populate('items.product')
      .populate('items.store')
      .populate('doctorId', 'name email');
    
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    
    // Get company details
    const company = await Company.findOne();
    
    // Helper function to convert number to words
    function convertToWords(amount) {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      
      if (amount === 0) return 'Zero Only';
      
      let words = '';
      const crores = Math.floor(amount / 10000000);
      const lakhs = Math.floor((amount % 10000000) / 100000);
      const thousands = Math.floor((amount % 100000) / 1000);
      const hundreds = Math.floor((amount % 1000) / 100);
      const remainder = amount % 100;
      
      if (crores > 0) words += convertHundreds(crores) + ' Crore ';
      if (lakhs > 0) words += convertHundreds(lakhs) + ' Lakh ';
      if (thousands > 0) words += convertHundreds(thousands) + ' Thousand ';
      if (hundreds > 0) words += ones[hundreds] + ' Hundred ';
      if (remainder > 0) {
        if (remainder < 10) words += ones[remainder];
        else if (remainder < 20) words += teens[remainder - 10];
        else words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10];
      }
      
      return words.trim() + ' Only';
      
      function convertHundreds(num) {
        let result = '';
        const h = Math.floor(num / 100);
        const r = num % 100;
        if (h > 0) result += ones[h] + ' Hundred ';
        if (r > 0) {
          if (r < 10) result += ones[r];
          else if (r < 20) result += teens[r - 10];
          else result += tens[Math.floor(r / 10)] + ' ' + ones[r % 10];
        }
        return result.trim();
      }
    }
    
    // Prepare invoice data
    const invoiceData = {
      // Company Details
      company: {
        name: company?.companyName || 'SRM Arnik Skin & Healthcare Clinic',
        address: company?.address || '1st floor CE /1 /A / 151 Street No 198 CE Block Near Axis Mall Action Area I New Town Kolkata',
        phone: company?.phone || '+918981443595',
        email: company?.email || 'srmarnik@gmail.com',
        gst: company?.gst || 'NA',
        pan: company?.pan || 'NA',
        logo: company?.logo || '',
        signature: company?.signature || '',
        bankName: company?.bankName || 'NA',
        accountNo: company?.accountNo || '000000',
        ifsc: company?.ifsc || 'NA',
        beneficiaryName: company?.beneficiaryName || 'NA'
      },
      
      // Invoice Details
      invoice: {
        number: purchase.billNo,
        date: purchase.billDate,
        vendorBillNo: purchase.vendorBillNo,
        vendorBillDate: purchase.vendorBillDate,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt
      },
      doctor: {
        name: purchase.doctorId ? `${purchase.doctorId.name}` : 'NA'
      },
      // Vendor Details
      vendor: {
        name: purchase.vendor.name || purchase.vendor.firstName + ' ' + purchase.vendor.lastName,
        address: purchase.vendor.address || 'NA',
        phone: purchase.vendor.contact || purchase.vendor.phone || '',
        email: purchase.vendor.email || '',
        gst: purchase.vendor.gst || '',
        stateCode: purchase.vendor.stateCode || ''
      },
      
      // Products/Services
      items: purchase.items.map((item, index) => ({
        srNo: index + 1,
        description: item.product.productName,
        storeName: item.store?.name || 'NA',
        hsnSac: item.product.hsnSac || '',
        qty: item.qty,
        rate: item.rate,
        subtotal: item.subtotal,
        cgstPercent: item.cgstPercent || 0,
        sgstPercent: item.sgstPercent || 0,
        igstPercent: item.igstPercent || 0,
        total: item.total
      })),
      
      // Totals
      totals: {
        totalProductAmount: purchase?.totalProductAmount || 0,
        cgst: purchase?.cgst || 0,
        sgst: purchase?.sgst || 0,
        igst: purchase?.igst || 0,
        grandTotal: purchase?.grandTotal || 0
      },
      
      // Amount in words
      amountInWords: convertToWords(Math.floor(purchase?.grandTotal || 0))
    };
    
    res.json({ success: true, data: invoiceData });
  } catch (error) {
    console.error('Error generating purchase invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to get bulk purchase details
const getBulkPurchaseDetailsHelper = async (billNumbers) => {
  // Get all purchases with the provided bill numbers
  const purchases = await Purchase.find({ 
    billNo: { $in: billNumbers } 
  }).populate('vendor', 'name firstName lastName');
  
  if (purchases.length === 0) {
    throw new Error('No purchases found for the provided bill numbers');
  }
  
  // Get company details
  const company = await Company.findOne();
  
  // Group purchases by vendor
  const vendorGroups = {};
  let totalPurchaseAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalGrandTotal = 0;
  
  purchases.forEach(purchase => {
    const vendorId = purchase.vendor._id.toString();
    const vendorName = purchase.vendor.name || 
                      `${purchase.vendor.firstName} ${purchase.vendor.lastName}`;
    
    if (!vendorGroups[vendorId]) {
      vendorGroups[vendorId] = {
        vendorName,
        purchases: []
      };
    }
    
    vendorGroups[vendorId].purchases.push({
      billNo: purchase.billNo,
      purchaseDate: purchase.billDate,
      vendorInvoiceNumber: purchase.vendorBillNo,
      purchaseValue: purchase.totalProductAmount,
      grandTotal: purchase.grandTotal,
      cgst: purchase.cgst,
      sgst: purchase.sgst,
      igst: purchase.igst
    });
    
    // Add to totals
    totalPurchaseAmount += purchase.totalProductAmount || 0;
    totalGrandTotal += purchase.grandTotal || 0;
    totalCGST += purchase.cgst || 0;
    totalSGST += purchase.sgst || 0;
    totalIGST += purchase.igst || 0;
  });
  
  return {
    company: {
      name: company?.companyName || 'SRM Arnik Skin & Healthcare Clinic',
      address: company?.address || '1st floor CE /1 /A / 151 Street No 198 CE Block Near Axis Mall Action Area I New Town Kolkata',
      phone: company?.phone || '+918981443595',
      email: company?.email || 'srmarnik@gmail.com',
      gst: company?.gst || 'NA',
      pan: company?.pan || 'NA',
      logo: company?.logo || '',
      signature: company?.signature || '',
      bankName: company?.bankName || 'NA',
      accountNo: company?.accountNo || '000000',
      ifsc: company?.ifsc || 'NA',
      beneficiaryName: company?.beneficiaryName || 'NA'
    },
    vendorWisePurchases: Object.values(vendorGroups),
    summary: {
      totalPurchaseAmount: Math.round(totalPurchaseAmount),
      gstDetails: {
        totalCGST,
        totalSGST,
        totalIGST,
        totalGST: totalCGST + totalSGST + totalIGST
      },
      totalBills: purchases.length,
      totalVendors: Object.keys(vendorGroups).length
    }
  };
};

// Bulk purchase details API
exports.getBulkPurchaseDetails = async (req, res) => {
  try {
    const { billNumbers } = req.body;
    
    if (!billNumbers || !Array.isArray(billNumbers) || billNumbers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'billNumbers array is required' 
      });
    }
    
    // Check if all purchases belong to the same vendor
    const purchases = await Purchase.find({ 
      billNo: { $in: billNumbers } 
    }).populate('vendor', 'name firstName lastName');
    
    const uniqueVendors = [...new Set(purchases.map(p => p.vendor._id.toString()))];
    if (uniqueVendors.length > 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'All bill numbers must belong to the same vendor' 
      });
    }
    
    const result = await getBulkPurchaseDetailsHelper(billNumbers);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting bulk purchase details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


