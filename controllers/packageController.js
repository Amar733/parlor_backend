const Package = require('../models/Package');
const CustomerSubscription = require('../models/CustomerSubscription');
const Product = require('../models/Product');

// Get all package templates
exports.getPackages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, doctorId, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { packageName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (doctorId) query.doctorIds = doctorId;
    if (status !== undefined) query.status = status === 'true';
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const packages = await Package.find(query)
      .populate('services', 'productName sellingPrice')
      .populate('doctorIds', 'name')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Package.countDocuments(query);
    
    res.json({
      success: true,
      data: packages,
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

// Get package template by ID
exports.getPackageById = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id)
      .populate('services', 'productName sellingPrice')
      .populate('doctorIds', 'name');
    
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    res.json({ success: true, data: package });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create package template
exports.createPackage = async (req, res) => {
  try {
    const { packageName, services, numberOfTimes, frequencyInDays, price, doctorIds, description } = req.body;
    
    // Validate ObjectIds
    const mongoose = require('mongoose');
    const invalidServiceIds = services.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidServiceIds.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid service IDs: ${invalidServiceIds.join(', ')}` 
      });
    }
    
    // Debug: Check database connection and collection
    console.log('Database name:', mongoose.connection.db.databaseName);
    console.log('Collections:', await mongoose.connection.db.listCollections().toArray());
    
    // Try different queries to debug
    const allProducts = await Product.find({});
    console.log('Total products in database:', allProducts.length);
    
    const allServices = await Product.find({ type: 'Service' });
    console.log('Total services in database:', allServices.length);
    console.log('All services:', allServices.map(s => ({ id: s._id.toString(), name: s.productName, type: s.type })));
    
    // Try finding by string IDs
    const servicesByString = await Product.find({ _id: { $in: services.map(id => id.toString()) } });
    console.log('Services found by string IDs:', servicesByString.length);
    
    // Try finding each service individually
    for (const serviceId of services) {
      const singleService = await Product.findById(serviceId);
      console.log(`Service ${serviceId}:`, singleService ? { id: singleService._id, name: singleService.productName, type: singleService.type } : 'NOT FOUND');
    }
    
    // Verify all services exist and are of type 'Service'
    const serviceProducts = await Product.find({ _id: { $in: services } });
    console.log('Found services:', serviceProducts.length, 'Expected:', services.length);
    console.log('Service IDs sent:', services);
    console.log('Services found:', serviceProducts.map(s => ({ id: s._id, name: s.productName, type: s.type })));
    
    if (serviceProducts.length !== services.length) {
      const foundIds = serviceProducts.map(s => s._id.toString());
      const missingIds = services.filter(id => !foundIds.includes(id));
      return res.status(400).json({ 
        success: false, 
        message: `Services not found: ${missingIds.join(', ')}` 
      });
    }
    
    const invalidServices = serviceProducts.filter(service => service.type !== 'Service');
    if (invalidServices.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `These items are not services: ${invalidServices.map(s => s.productName).join(', ')}` 
      });
    }
    
    const package = new Package({
      packageName, services, numberOfTimes, frequencyInDays, price,
      doctorIds, description, createdBy: req.user?.id
    });
    
    await package.save();
    
    res.status(201).json({ success: true, data: package });
  } catch (error) {
    console.error('Package creation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update package template
exports.updatePackage = async (req, res) => {
  try {
    const package = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    res.json({ success: true, data: package });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Customer Subscription Methods

// Get customer subscriptions
exports.getCustomerSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, customer, doctorId, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (customer) query.customer = customer;
    if (doctorId) query.doctorId = doctorId;
    if (status) query.status = status;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const subscriptions = await CustomerSubscription.find(query)
      .populate('packageTemplate', 'packageName price')
      .populate('customer', 'firstName lastName contact')
      .populate('doctorId', 'name')
      .populate('paymentMode.paymentMode', 'payType')
      .populate('firstInstallment.paymentMode', 'payType')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CustomerSubscription.countDocuments(query);
    
    res.json({
      success: true,
      data: subscriptions,
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

// Create customer subscription
exports.createCustomerSubscription = async (req, res) => {
  try {
    const { 
      packageTemplate, customer, doctorId, grandTotal, 
      paymentType, paymentMode, installments 
    } = req.body;

    const packageTemplates = await Package.findById(packageTemplate);
    if (!packageTemplates) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    const subscriptionData = {
      customer,
      installments,
      packageTemplate: packageTemplates._id,
      doctorId,
      grandTotal,
      billAmount : grandTotal,
      paymentType,
      paymentMode: paymentMode || [],
      createdBy: req.user?.id
    };
    
    // Set first installment
    // subscriptionData.firstInstallment = {
    //   amount: billAmount,
    //   paymentMode: paymentMode[0]?.paymentMode,
    //   paidDate: new Date(),
    //   status: 'paid'
    // };
    
    // Generate remaining installments if payment type is installment
    // if (paymentType === 'installment' && installmentCount > 1) {
    //   const remainingAmount = grandTotal - billAmount;
    //   const remainingInstallments = installmentCount - 1;
    //   const installmentAmt = installmentAmount || Math.ceil(remainingAmount / remainingInstallments);
      
    //   subscriptionData.installments = [];
    //   for (let i = 1; i <= remainingInstallments; i++) {
    //     const dueDate = new Date();
    //     dueDate.setMonth(dueDate.getMonth() + i);
        
    //     subscriptionData.installments.push({
    //       amount: i === remainingInstallments ? remainingAmount - (installmentAmt * (remainingInstallments - 1)) : installmentAmt,
    //       dueDate,
    //       status: 'pending'
    //     });
    //   }
    // }
    
    // Set status
    subscriptionData.status = paymentType === 'full' ? 'paid' : 'partial';
    
    const subscription = new CustomerSubscription(subscriptionData);
    await subscription.save();
    
    // Populate for response
    const populatedSubscription = await CustomerSubscription.findById(subscription._id)
      .populate('customer', 'firstName lastName contact')
      .populate('packageTemplate', 'packageName price')
      .populate('doctorId', 'name')
      .populate('paymentMode.paymentMode', 'payType')
      .populate('firstInstallment.paymentMode', 'payType');
    
    res.status(201).json({ 
      success: true, 
      message: 'Package sale created successfully',
      data: populatedSubscription 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  try {
    const { paymentReceived } = req.body;
    const subscription = await CustomerSubscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    
    subscription.paymentReceived = paymentReceived;
    await subscription.save();
    
    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Use service (increment used times)
exports.useService = async (req, res) => {
  try {
    const subscription = await CustomerSubscription.findById(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    
    if (subscription.usedTimes >= subscription.numberOfTimes) {
      return res.status(400).json({ success: false, message: 'Subscription already fully used' });
    }
    
    subscription.usedTimes += 1;
    await subscription.save();
    
    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete package template
exports.deletePackage = async (req, res) => {
  try {
    const package = await Package.findByIdAndDelete(req.params.id);
    
    if (!package) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    
    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate invoice for package subscription
exports.generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get subscription with populated data
    const subscription = await CustomerSubscription.findById(id)
      .populate('customer')
      .populate({
        path: 'packageTemplate',
        select: 'packageName services',
        populate: {
          path: 'services',
          model: 'Product',
          select: 'productName hsnSac price'
        }
      })
      .populate('doctorId', 'name email')
      .populate('paymentMode.paymentMode', 'payType deduction');
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Package subscription not found' });
    }
    
    // Get company details
    const Company = require('../models/Company');
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
        number: `PKG-${subscription._id.toString().slice(-8).toUpperCase()}`,
        date: subscription.startDate,
        dueDate: subscription.endDate,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      },
      
      // Customer Details
      customer: {
        name: `${subscription.customer.firstName} ${subscription.customer.lastName}`,
        age: subscription.customer.age || '',
        address: subscription.customer.address || 'NEWTOWN',
        phone: subscription.customer.contact || '',
        email: subscription.customer.email || '',
        gst: subscription.customer.gst || '',
        stateCode: subscription.customer.stateCode || ''
      },
      
      // Doctor Details
      doctor: {
        name: subscription.doctorId?.name || '',
        email: subscription.doctorId?.email || ''
      },
      
      // Package Details
      package: {
        name: subscription.packageTemplate?.packageName || '',
        services: subscription.packageTemplate?.services || []
      },
      
      // Payment Details
      payment: {
        grandTotal: subscription.grandTotal,
        // billAmount: subscription.billAmount,
        paymentModes: subscription.paymentMode?.map(pm => ({
          type: pm.paymentMode?.payType || 'Cash',
          amount: pm.amount || 0,
          deduction: pm.paymentMode?.deduction || 0
        })) || [],
        amountInWords: convertToWords(subscription.grandTotal)
      },
      
      // First Installment (Paid)
      firstInstallment: subscription.firstInstallment ? {
        amount: subscription.firstInstallment.amount,
        paymentMode: subscription.firstInstallment.paymentMode,
        status: 'paid'
      } : null,
      
      // Remaining Installments
      installments: subscription.installments?.map((installment, index) => ({
        srNo: index + 1,
        amount: installment.amount,
        dueDate: installment.dueDate,
        status: installment.status,
        paymentMode: installment.paymentMode || ''
      })) || [],
      
      // Status
      status: {
        subscriptionStatus: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        isActive: subscription.status === 'active'
      },
      
      // Additional Info
      notes: {
        terms: 'Package terms and conditions apply. Services must be used within the validity period.',
        remarks: subscription.notes || '',
        reverseCharge: 'Whether Tax is paid under Reverse Charge Basis : No'
      }
    };
    
    res.json({ success: true, data: invoiceData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pay installment
exports.payInstallment = async (req, res) => {
  try {
    const { subscriptionId, installmentId } = req.params;
    const { paymentMode, amount, paidDate } = req.body;
    
    const subscription = await CustomerSubscription.findById(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    
    const installment = subscription.installments.id(installmentId);
    
    if (!installment) {
      return res.status(404).json({ success: false, message: 'Installment not found' });
    }
    
    if (installment.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Installment already paid' });
    }
    
    installment.paymentMode = paymentMode;
    installment.paidDate = paidDate || new Date();
    installment.status = 'paid';
    
    // Check if all installments are paid
    const allInstallmentsPaid = subscription.installments.every(inst => inst.status === 'paid');
    if (allInstallmentsPaid) {
      subscription.status = 'paid';
    }
    
    await subscription.save();
    
    res.json({ 
      success: true, 
      message: 'Installment paid successfully',
      data: installment 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete customer subscription
exports.deleteCustomerSubscription = async (req, res) => {
  try {
    const subscription = await CustomerSubscription.findByIdAndDelete(req.params.id);
    
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }
    
    res.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};