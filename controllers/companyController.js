const Company = require('../models/Company');

// Get company (always returns single company or creates default)
exports.getCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({ companyName: 'Default Company' });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create company (only if none exists)
exports.createCompany = async (req, res) => {
  try {
    const existingCompany = await Company.findOne();
    if (existingCompany) {
      return res.status(400).json({ success: false, message: 'Company already exists. Use update instead.' });
    }

    const {
      companyName, website, contactPerson, phone, email, address,
      taxName, tax, currency, gst, billPrefix, stateCode,
      bankName, accountNo, ifsc, beneficiaryName, pan,
      billStartNo, bookingStartNo, workOrderStartNo, quotationStartNo, purchaseOrderStartNo,
      aboutUs, facebook, twitter, youtube, instagram,
      resetSalesBillCounter, resetPurchaseBillCounter, resetBookingCounter,logo,signature
    } = req.body;

    const companyData = {
      companyName, website, contactPerson, phone, email, address,
      taxName, tax, currency, gst, billPrefix, stateCode,
      bankName, accountNo, ifsc, beneficiaryName, pan,
      billStartNo, bookingStartNo, workOrderStartNo, quotationStartNo, purchaseOrderStartNo,
      aboutUs, facebook, twitter, youtube, instagram,
      resetSalesBillCounter, resetPurchaseBillCounter, resetBookingCounter,logo,signature
    };


    const company = await Company.create(companyData);
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update company (creates if doesn't exist)
exports.updateCompany = async (req, res) => {
  try {
    const {
      companyName, website, contactPerson, phone, email, address,
      taxName, tax, currency, gst, billPrefix, stateCode,
      bankName, accountNo, ifsc, beneficiaryName, pan,
      billStartNo, bookingStartNo, workOrderStartNo, quotationStartNo, purchaseOrderStartNo,
      aboutUs, facebook, twitter, youtube, instagram,
      resetSalesBillCounter, resetPurchaseBillCounter, resetBookingCounter,logo,signature
    } = req.body;

    const updateData = {
      companyName, website, contactPerson, phone, email, address,
      taxName, tax, currency, gst, billPrefix, stateCode,
      bankName, accountNo, ifsc, beneficiaryName, pan,
      billStartNo, bookingStartNo, workOrderStartNo, quotationStartNo, purchaseOrderStartNo,
      aboutUs, facebook, twitter, youtube, instagram,
      resetSalesBillCounter, resetPurchaseBillCounter, resetBookingCounter,logo,signature
    };


    let company = await Company.findOne();
    if (company) {
      company = await Company.findByIdAndUpdate(company._id, updateData, { new: true });
    } else {
      company = await Company.create(updateData);
    }

    res.json({ success: true, data: company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};