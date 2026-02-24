const mongoose = require('mongoose');
const SalesBill = require('../models/SalesBill');
const StockTransaction = require('../models/StockTransaction');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Product = require('../models/Product');
const Patient = require('../models/Patient');
const ActivityLog = require('../models/ActivityLog');
// Get all sales bills
exports.getSalesBills = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, customer, status, paymentMode, startDate, endDate, minAmount, maxAmount, mobile, name, category, serviceType, doctorId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query conditions array
    let conditions = [];
    
    // Search functionality
    if (search) {
      const customers = await Patient.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { contact: { $regex: search, $options: 'i' } }
        ]
      });
      
      const products = await Product.find({
        $or: [
          { productName: { $regex: search, $options: 'i' } },
          { type: { $regex: search, $options: 'i' } }
        ]
      });
      
      const categories = await mongoose.model('Category').find({
        categoryName: { $regex: search, $options: 'i' }
      });
      
      const customerIds = customers.map(c => c._id);
      const productIds = products.map(p => p._id);
      const categoryIds = categories.map(c => c._id);
      
      const productsInCategories = await Product.find({
        category: { $in: categoryIds }
      });
      const categoryProductIds = productsInCategories.map(p => p._id);
      const allProductIds = [...new Set([...productIds, ...categoryProductIds])];
      
      conditions.push({
        $or: [
          { billNo: { $regex: search, $options: 'i' } },
          { project: { $regex: search, $options: 'i' } },
          { remarks: { $regex: search, $options: 'i' } },
          { terms: { $regex: search, $options: 'i' } },
          { customer: { $in: customerIds } },
          { 'items.product': { $in: allProductIds } }
        ]
      });
    }
    
    // Filter by mobile number
    if (mobile) {
      const customersByMobile = await Patient.find({
        contact: { $regex: mobile, $options: 'i' }
      });
      conditions.push({ customer: { $in: customersByMobile.map(c => c._id) } });
    }
    
    // Filter by customer name
    if (name) {
      const customersByName = await Patient.find({
        $or: [
          { firstName: { $regex: name, $options: 'i' } },
          { lastName: { $regex: name, $options: 'i' } }
        ]
      });
      conditions.push({ customer: { $in: customersByName.map(c => c._id) } });
    }
    
    // Filter by category
    if (category) {
      const productsInCategory = await Product.find({ category });
      conditions.push({ 'items.product': { $in: productsInCategory.map(p => p._id) } });
    }
    
    // Filter by service type
    if (serviceType) {
      const productsByType = await Product.find({ type: serviceType });
      conditions.push({ 'items.product': { $in: productsByType.map(p => p._id) } });
    }
    
    // Filter by customer ID
    if (customer) {
      conditions.push({ customer });
    }
    
    // Filter by status
    if (status) {
      conditions.push({ status });
    }
    
    // Filter by payment mode (handle both single and array)
    if (paymentMode) {
      conditions.push({
        $or: [
          { paymentMode },
          { 'paymentModes.paymentMode': paymentMode }
        ]
      });
    }
    
    // Filter by doctorId
    if (doctorId) {
      conditions.push({ doctorId });
    }
    
    // Date range filter
    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      conditions.push({ billDate: dateFilter });
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      const amountFilter = {};
      if (minAmount) amountFilter.$gte = parseFloat(minAmount);
      if (maxAmount) amountFilter.$lte = parseFloat(maxAmount);
      conditions.push({ grandTotal: amountFilter });
    }
    
    // Build final query
    const query = conditions.length > 0 ? { $and: conditions } : {};
    
    // Sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Execute query with pagination
    const bills = await SalesBill.find(query)
      .populate('customer', 'firstName lastName contact')
      .populate('items.product', 'productName')
      .populate('items.store', 'name')
      .populate('paymentMode')
      .populate('paymentModes.paymentMode')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count
    const total = await SalesBill.countDocuments(query);
    
    // Calculate grand total for filtered results
    let grandTotalSum = 0;
    if (total > 0) {
      // Use the same query to get all matching bills for total calculation
      const allMatchingBills = await SalesBill.find(query, 'grandTotal');
      grandTotalSum = allMatchingBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
    }
    
    res.json({ 
      success: true, 
      data: bills,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      grandTotalSum
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get sales bill by ID
exports.getSalesBillById = async (req, res) => {
  try {
    const bill = await SalesBill.findById(req.params.id)
      .populate('customer')
      .populate('items.store', 'name')
      .populate('paymentMode')
      .populate('paymentModes.paymentMode')
      .populate('items.product');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Sales bill not found' });
    }
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create sales bill
exports.createSalesBill = async (req, res) => {
  try {
    const {
      customer, project, items, subtotal, discountType, discountValue,doctorId,
       shippingCost, grandTotal, paymentMode, paymentModes,
     status, tds, remarks, terms, creditNoteAmount, uploadedDocs
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
    
    const billData = {
      customer, project, items, subtotal, discountType, discountValue,totalProductAmount,doctorId,
      cgst, sgst, igst, shippingCost, grandTotal,
       status, tds, remarks, terms, creditNoteAmount, uploadedDocs,
      createdBy: req.user?.id
    };
    
    // Add billDate if provided
    if (req.body.billDate) {
      billData.billDate = new Date(req.body.billDate);
    }
    
    // Handle payment modes - use array if provided, otherwise single mode
    if (paymentModes && Array.isArray(paymentModes)) {
      billData.paymentModes = paymentModes;
    } else if (paymentMode && !Array.isArray(paymentMode)) {
      billData.paymentMode = paymentMode;
    } else if (Array.isArray(paymentMode)) {
      // If paymentMode is sent as array, use it as paymentModes
      billData.paymentModes = paymentMode;
    }
    
    const bill = new SalesBill(billData);
    await bill.save();

    // Log activity
    await ActivityLog.create({
      actor: {
        id: req.user?._id?.toString() || 'system',
        name: req.user?.name || 'System'
      },
      action: 'CREATE_SALES_BILL',
      entity: {
        type: 'SalesBill',
        id: bill._id.toString(),
        name: `Sales Bill: ${bill.billNo}`
      },
      details: {
        billNo: bill.billNo,
        customer: bill.customer,
        grandTotal: bill.grandTotal,
        status: bill.status
      },
      request: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });
    
    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update sales bill with stock management
exports.updateSalesWithStockManagementBill = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer, project, items, subtotal, discountType, discountValue, doctorId,
      shippingCost, grandTotal, paymentMode, paymentModes,
      status, tds, remarks, terms, creditNoteAmount, uploadedDocs
    } = req.body;

    // Get existing sales bill
    const existingBill = await SalesBill.findById(id).populate('items.product');
    if (!existingBill) {
      return res.status(404).json({ success: false, message: 'Sales bill not found' });
    }

    // Reverse previous stock transactions only if old bill was paid
    if (existingBill.status === 'paid') {
      for (const oldItem of existingBill.items) {
        const productData = await Product.findById(oldItem.product._id);
        if (productData && productData.type !== 'Service') {
          await StockTransaction.create({
            product: oldItem.product._id,
            transactionType: 'IN',
            qty: oldItem.qty,
            reference: `Sales Bill Update Reversal: ${existingBill.billNo}`,
            store: oldItem.store,
            createdBy: req.user?.id
          });
        }
      }
    }

    // Calculate tax amounts from new items
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

    const updateData = {
      customer, project, items, subtotal, discountType, discountValue, totalProductAmount, doctorId,
      cgst, sgst, igst, shippingCost, grandTotal,
      status, tds, remarks, terms, creditNoteAmount, uploadedDocs
    };

    // Add billDate if provided
    if (req.body.billDate) {
      updateData.billDate = new Date(req.body.billDate);
    }

    // Handle payment modes
    if (paymentModes && Array.isArray(paymentModes)) {
      updateData.paymentModes = paymentModes;
      updateData.$unset = { paymentMode: 1 };
    } else if (paymentMode && Array.isArray(paymentMode)) {
      // If paymentMode is sent as array, treat it as paymentModes
      updateData.paymentModes = paymentMode;
      updateData.$unset = { paymentMode: 1 };
    } else if (paymentMode && !Array.isArray(paymentMode)) {
      updateData.paymentMode = paymentMode;
      updateData.$unset = { paymentModes: 1 };
    }

    // Update the sales bill
    const updatedBill = await SalesBill.findByIdAndUpdate(id, updateData, { new: true });

    // Create new stock transactions only if new status is paid
    if (status === 'paid') {
      for (const newItem of items) {
        const productData = await Product.findById(newItem.product);
        if (productData && productData.type !== 'Service') {
          await StockTransaction.create({
            product: newItem.product,
            transactionType: 'OUT',
            qty: newItem.qty,
            reference: `Sales Bill Update: ${updatedBill.billNo}`,
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
      action: 'UPDATE_SALES_BILL',
      entity: {
        type: 'SalesBill',
        id: updatedBill._id.toString(),
        name: `Sales Bill: ${updatedBill.billNo}`
      },
      details: {
        billNo: updatedBill.billNo,
        customer: updatedBill.customer,
        grandTotal: updatedBill.grandTotal,
        status: updatedBill.status
      },
      request: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ success: true, data: updatedBill });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createSalesBillBulk = async (req, res) => {
  try {
    const {
      customer, project, items, subtotal, discountType, discountValue,
       shippingCost, grandTotal, paymentMode,
     status, tds, remarks, terms, creditNoteAmount, uploadedDocs, date
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
        const customerId = await Patient.findOne({ old_id: customer });

    const bill = new SalesBill({
      customer: customerId ? customerId._id : customer, project, items: newItems, subtotal, discountType, discountValue, totalProductAmount,
      cgst, sgst, igst, shippingCost, grandTotal, paymentMode,
      status, tds, remarks, terms, creditNoteAmount, uploadedDocs,
      billDate: date ? new Date(date) : new Date(),
      createdBy: req.user?.id
    });
    
    await bill.save();
    
    // Create stock transactions for paid bills
    if (status === 'paid') {
      for (const item of bill.items) {
        // Skip stock transactions for services
        const productData = await Product.findById(item.product);
        if (productData && productData.type === 'Service') {
          continue;
        }
        
        await StockTransaction.create({
          product: item.product,
          transactionType: 'OUT',
          qty: item.qty,
          reference: `Sales Bill: ${bill.billNo}`,
          store: item.store,
          createdBy: req.user?.id,
          createdAt: date ? new Date(date) : new Date()
        });
      }
    }
     

    
    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update sales bill
exports.updateSalesBill = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (items) {
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
      
      req.body.cgst = cgst;
      req.body.sgst = sgst;
      req.body.igst = igst;
      req.body.totalProductAmount = totalProductAmount;
    }
    
    const bill = await SalesBill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Sales bill not found' });
    }
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Generate invoice for sales bill
exports.generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get sales bill with populated data
    const bill = await SalesBill.findById(id)
      .populate('customer')
      .populate('items.product')
      .populate('items.store')
      .populate('paymentMode')
      .populate('paymentModes.paymentMode')
      .populate('doctorId', 'name email');

      
    
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Sales bill not found' });
    }
    
    // Get company details
    const Company = require('../models/Company');
    const company = await Company.findOne();
    
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
        number: bill.billNo,
        date: bill.billDate,
        dueDate: bill.billDate,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt
      },
      
      // Customer Details
    customer: {
        name: `${bill.customer.firstName} ${bill.customer.lastName}`,
        age: `${bill.customer.age}`,
        address: bill.customer.address || 'NEWTOWN',
        phone: bill.customer.contact || '',
        email: bill.customer.email || '',
        gst: bill.customer.gst || '',
        stateCode: bill.customer.stateCode || ''
      },
      doctor: {
        name: `${bill.doctorId.name}`,
       
      },
      
      // Products/Services
      items: bill.items.map((item, index) => ({
        srNo: index + 1,
        description: item.product.productName,
        storeName: item.store?.name || 'NA',
        hsnSac: item.product.hsnSac || '',
        qty: item.qty,
        rate: item.rate,
        subtotal: item.subtotal,
        is_igst: item.is_igst || false,
        ...(item.is_igst ? 
          { igstPercent: item.igstPercent || 0 } : 
          { cgstPercent: item.cgstPercent || 0, sgstPercent: item.sgstPercent || 0 }
        ),
        total: item.total
      })),
      
      // Totals
      totals: {
        // subtotal: bill.subtotal,
        discount: bill.discountType === 'fixed' ? (bill.discountValue || 0) : 
        bill.discountType === 'percentage' ? ((bill.totalProductAmount + bill.cgst + bill.sgst + bill.igst) * (bill.discountValue || 0) / 100) : 0,
        get payment_charge() {
          // Handle both single and multiple payment modes
          const deduction = bill.paymentMode?.deduction || 
            (bill.paymentModes && bill.paymentModes.length > 0 ? bill.paymentModes[0].paymentMode?.deduction : 0) || 0;
          return ((bill.totalProductAmount + bill.cgst + bill.sgst + bill.igst - this.discount) * deduction / 100) || 0;
        },

        cgst: bill.cgst,
        sgst: bill.sgst,
        igst: bill.igst,
        totalAmount: bill?.totalProductAmount, // after tax
        shippingCost: bill.shippingCost,
        grandTotal: bill.grandTotal , // grand t
        paid: bill.paidAmount,
        pending: bill.pendingAmount,
        tds: bill.tds,
        amountInWords: convertToWords(bill.grandTotal)
      },
      
      // Additional Info
      notes: {
        terms: bill.terms || 'Certified that the particulars given above are true and correct',
        remarks: bill.remarks || '',
        paymentMode: bill.paymentMode ? bill.paymentMode.payType : 
          (bill.paymentModes && bill.paymentModes.length > 0 ? 
            bill.paymentModes.map(pm => `${pm.paymentMode?.payType}: ₹${pm.amount}`).join(', ') : ''),
        reverseCharge: 'Whether Tax is paid under Reverse Charge Basis : No'
      }
    };
    
    res.json({ success: true, data: invoiceData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

// Delete sales bill
exports.deleteSalesBill = async (req, res) => {
  try {
    const bill = await SalesBill.findById(req.params.id).populate('items.product');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Sales bill not found' });
    }
    
    // Prevent deletion of paid sales bills
    // if (bill.status === 'paid') {
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: 'Cannot delete paid sales bill.' 
    //   });
    // }
    
      for (const item of bill.items) {
        const productData = await Product.findById(item.product._id);
        if (productData && productData.type !== 'Service') {
          await StockTransaction.create({
            product: item.product._id,
            transactionType: 'IN',
            qty: item.qty,
            reference: `Sales Bill Deletion: ${bill.billNo}`,
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
      action: 'DELETE_SALES_BILL',
      entity: {
        type: 'SalesBill',
        id: bill._id.toString(),
        name: `Sales Bill: ${bill.billNo}`
      },
      details: {
        billNo: bill.billNo,
        customer: bill.customer,
        grandTotal: bill.grandTotal,
        status: bill.status,
        deletedItems: bill.items.length
      },
      request: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });
    
    await SalesBill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Sales bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status, paidAmount } = req.body;
    const bill = await SalesBill.findById(req.params.id).populate('items.product');
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Sales bill not found' });
    }
    
    if (bill.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Bill is already fully paid' });
    }
    
    bill.status = status;
    bill.paidAmount = paidAmount;
    bill.pendingAmount = bill.grandTotal - paidAmount;
    await bill.save();
    
    // Create stock transactions based on payment status
    if (status === 'paid' || status === 'partial') {
      const newPaymentRatio = paidAmount / bill.grandTotal;
      
      for (const item of bill.items) {
        // Skip stock transactions for services
        if (item.product.type === 'Service') {
          continue;
        }
        
        // Calculate total quantity that should be out based on new payment
        const totalOutQty = status === 'paid' ? item.qty : Math.floor(item.qty * newPaymentRatio);
        
        // Find already processed quantity for this product
        const existingTransactions = await StockTransaction.find({
          reference: `Sales Bill: ${bill.billNo}`,
          product: item.product,
          transactionType: 'OUT'
        });
        
        const alreadyOutQty = existingTransactions.reduce((sum, trans) => sum + trans.qty, 0);
        const remainingQty = totalOutQty - alreadyOutQty;
        
        if (remainingQty > 0) {
          await StockTransaction.create({
            product: item.product,
            transactionType: 'OUT',
            qty: remainingQty,
            reference: `Sales Bill: ${bill.billNo}`,
            store: item.store,
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
      action: 'UPDATE_SALES_PAYMENT_STATUS',
      entity: {
        type: 'SalesBill',
        id: bill._id.toString(),
        name: `Sales Bill: ${bill.billNo}`
      },
      details: {
        billNo: bill.billNo,
        newStatus: status,
        paidAmount: paidAmount,
        grandTotal: bill.grandTotal
      },
      request: {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      }
    });
    
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};