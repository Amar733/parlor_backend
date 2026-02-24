const DoctorSetting = require('../models/DoctorSetting');
const ManagedUser = require('../models/ManagedUser');
const Company = require('../models/Company');

// Get all doctor settings
exports.getDoctorSettings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const doctorSettings = await DoctorSetting.find()
      .populate('doctor_id', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DoctorSetting.countDocuments();

    res.json({
      success: true,
      data: doctorSettings,
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

// Get doctor setting by doctor_id
exports.getDoctorSettingById = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    // First try to find in DoctorSetting
    let doctorSetting = await DoctorSetting.findOne({ doctor_id: doctorId })
      .populate('doctor_id', 'name email phone');

    if (doctorSetting) {
      return res.json({ success: true, data: doctorSetting });
    }

    // If not found, fetch from ManagedUser and return in required format
    const managedUser = await ManagedUser.findById(doctorId);

    if (!managedUser) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Get company name from Company settings as fallback for clinicName
    const company = await Company.findOne();

    // Return data in DoctorSetting format with available ManagedUser data
    const doctorData = {
      doctor_id: managedUser._id,
      doctorName: managedUser.name || null,
      degree: null,
      speciality: managedUser?.specialization || null,
      regNo: null,
      clinicName: managedUser?.companyName || company?.companyName || null,
      address: managedUser?.address || company?.address || null,
      phone: managedUser?.phone || company?.phone || null,
      email: managedUser?.email || company?.email || null,
      logo: company?.logo || null,
      templateTheme: 'default',
      signature: null
    };

    res.json({ success: true, data: doctorData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create or update doctor setting
exports.upsertDoctorSetting = async (req, res) => {
  try {
    const { doctor_id, doctorName, degree, speciality, regNo, clinicName, address, phone, email, logo, templateTheme, signature } = req.body;

    const settingData = {
      doctor_id, doctorName, degree, speciality, regNo, clinicName, address, phone, email, logo, templateTheme, signature
    };

    const doctorSetting = await DoctorSetting.findOneAndUpdate(
      { doctor_id },
      settingData,
      { new: true, upsert: true, runValidators: true }
    ).populate('doctor_id', 'name email');

    // Update doctor name in ManagedUser table if it changed
    if (doctorName) {
      await ManagedUser.findByIdAndUpdate(doctor_id, { name: doctorName });
    }

    res.json({ success: true, data: doctorSetting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete doctor setting
exports.deleteDoctorSetting = async (req, res) => {
  try {
    const doctorSetting = await DoctorSetting.findByIdAndDelete(req.params.id);

    if (!doctorSetting) {
      return res.status(404).json({ success: false, message: 'Doctor setting not found' });
    }

    res.json({ success: true, message: 'Doctor setting deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};