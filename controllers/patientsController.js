const Patient = require("../models/Patient");
const SalesBill = require('../models/SalesBill');
const { buildRoleBasedQuery } = require("../middleware/roleBasedFilter");
const LogService = require("../services/logService");
// Helper function to check permissions
const hasPermission = (user, permission) => {
  // Admin always has all permissions
  if (user.role === "admin") return true;

  // Doctor role permissions for patient access
  if (user.role === "doctor") {
    if (
      permission.startsWith("/dashboard/patients:") ||
      permission.startsWith("/dashboard/profile:")
    ) {
      return true;
    }
  }

  // Check specific permissions for other roles
  return user.permissions && user.permissions.includes(permission);
}

exports.createPatient = async (req, res) => {
  try {
    // if (
    //   !req.user ||
    //   (!hasPermission(req.user, "/dashboard/patients:create") &&
    //     req.user.role !== "admin")
    // ) {
    //   return res.status(403).json({ message: "Forbidden" });
    // }
    const { firstName, lastName, contact, age, gender, address } = req.body;
    if (!firstName || !lastName || !contact) {
      return res.status(400).json({
        message: "Missing required fields: firstName, lastName, and contact",
      });
    }
    const existingPatient = await Patient.findOne({
      firstName,
      lastName,
      contact,
    });
    if (existingPatient) {
      return res.status(409).json({
        message: "A patient with this name and contact number already exists.",
      });
    }
    const patientsWithSameContact = await Patient.find({ contact });
    const newPatientData = {
      firstName,
      lastName,
      contact,
      age,
      gender,
      address,
      is_primary: patientsWithSameContact.length === 0,
      associated_with_mobile: patientsWithSameContact.length > 0,
    };
    const patient = new Patient(newPatientData);
    const createdPatient = await patient.save();
    if (patientsWithSameContact.length === 1) {
      await Patient.findByIdAndUpdate(patientsWithSameContact[0]._id, {
        associated_with_mobile: true,
      });
    }
    await LogService.logActivity({
      actor: req.user ?? { id: "system", name: "Public User" },
      action: "CREATE_PATIENT",
      entity: {
        type: "Patient",
        id: createdPatient._id.toString(),
        name: `${createdPatient.firstName} ${createdPatient.lastName}`,
      },
      details: {
        patient: createdPatient.toObject(),
      },
      request: req,
    });
    res.status(201).json(createdPatient);
  } catch (error) {
    res.status(500).json({ message: "Error creating patient" });
  }
};
exports.createPatientBulk = async (req, res) => {
  try {

    const { firstName, lastName, contact, age, gender, address, old_id } = req.body;
    if (!firstName || !contact) {
      return res.status(400).json({
        message: "Missing required fields: firstName, lastName, and contact",
      });
    }
    const existingPatient = await Patient.findOne({
      firstName,
      lastName,
      contact,
    });
    if (existingPatient) {
      return res.status(409).json({
        message: "A patient with this name and contact number already exists.",
      });
    }
    const patientsWithSameContact = await Patient.find({ contact });
    const newPatientData = {
      firstName,
      lastName,
      contact,
      age,
      gender,
      address,
      is_primary: patientsWithSameContact.length === 0,
      associated_with_mobile: patientsWithSameContact.length > 0,
      old_id
    };
    const patient = new Patient(newPatientData);
    const createdPatient = await patient.save();
    if (patientsWithSameContact.length === 1) {
      await Patient.findByIdAndUpdate(patientsWithSameContact[0]._id, {
        associated_with_mobile: true,
      });
    }
    await LogService.logActivity({
      actor: req.user ?? { id: "system", name: "Public User" },
      action: "CREATE_PATIENT",
      entity: {
        type: "Patient",
        id: createdPatient._id.toString(),
        name: `${createdPatient.firstName} ${createdPatient.lastName}`,
      },
      details: {
        patient: createdPatient.toObject(),
      },
      request: req,
    });
    res.status(201).json(createdPatient);
  } catch (error) {
    res.status(500).json({ message: "Error creating patient" });
  }
};
exports.updatePatient = async (req, res) => {
  try {
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/patients:edit") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { id } = req.params;
    const currentPatient = await Patient.findById(id);
    if (!currentPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const updatedPatient = await Patient.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    await LogService.logActivity({
      actor: req.user,
      action: "UPDATE_PATIENT",
      entity: {
        type: "Patient",
        id: updatedPatient._id.toString(),
        name: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
      },
      details: {
        previousData: currentPatient.toObject(),
        updatedData: req.body,
      },
      request: req,
    });
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.softDeletePatient = async (req, res) => {
  try {
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/patients:delete") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { id } = req.params;
    const patientToSoftDelete = await Patient.findById(id);
    if (!patientToSoftDelete) {
      return res
        .status(404)
        .json({ message: "Patient not found or already deleted" });
    }
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!updatedPatient) {
      return res.status(500).json({ message: "Failed to delete patient" });
    }
    await LogService.logActivity({
      actor: req.user,
      action: "SOFT_DELETE_PATIENT",
      entity: {
        type: "Patient",
        id: id,
        name: `${patientToSoftDelete.firstName} ${patientToSoftDelete.lastName}`,
      },
      details: {
        deletedAt: updatedPatient.deletedAt,
      },
      request: req,
    }).catch((logError) => {
      console.error("Error logging soft delete activity:", logError);
      // Continue execution even if logging fails
    });
    res.json({
      ...updatedPatient.toObject(),
      message: `Patient ${patientToSoftDelete.firstName} ${patientToSoftDelete.lastName} has been successfully deleted`,
    });
  } catch (error) {
    console.error("Error in softDeletePatient:", error);
    res.status(500).json({ message: "Error deleting patient" });
  }
};

exports.restorePatient = async (req, res) => {
  try {
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/patients:edit") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { id } = req.params;
    const patientToRestore = await Patient.findOne({
      _id: id,
      deletedAt: { $exists: true },
    });
    if (!patientToRestore) {
      return res
        .status(404)
        .json({ message: "Patient not found or not deleted" });
    }
    const restoredPatient = await Patient.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: true } },
      { $unset: { deletedAt: 1 } },
      { new: true }
    );
    if (!restoredPatient) {
      return res.status(500).json({ message: "Failed to restore patient" });
    }
    await LogService.logActivity({
      actor: req.user,
      action: "RESTORE_PATIENT",
      entity: {
        type: "Patient",
        id: id,
        name: `${restoredPatient.firstName} ${restoredPatient.lastName}`,
      },
      details: {
        restored: true,
      },
      request: req,
    }).catch((logError) => {
      console.error("Error logging restore activity:", logError);
      // Continue execution even if logging fails
    });
    res.json({
      ...restoredPatient.toObject(),
      message: `Patient ${restoredPatient.firstName} ${restoredPatient.lastName} has been successfully restored`,
    });
  } catch (error) {
    console.error("Error in restorePatient:", error);
    res.status(500).json({ message: "Error restoring patient" });
  }
};

exports.permanentDeletePatient = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admins only" });
    }
    const { id } = req.params;
    const patientToDelete = await Patient.findById(id);
    if (!patientToDelete) {
      return res.status(404).json({ message: "Patient not found" });
    }
    
    // Check if patient has any sales bills
    const existingSalesBills = await SalesBill.findOne({ customer: id });
    if (existingSalesBills) {
      return res.status(400).json({ 
        message: "Cannot delete patient. Patient has associated sales bills." 
      });
    }
    
    const deletedPatient = await Patient.findByIdAndDelete(id);
    if (!deletedPatient) {
      return res
        .status(404)
        .json({ message: "Patient not found during deletion" });
    }
    await LogService.logActivity({
      actor: req.user,
      action: "PERMANENT_DELETE_PATIENT",
      entity: {
        type: "Patient",
        id: id,
        name: `${patientToDelete.firstName} ${patientToDelete.lastName}`,
      },
      details: {
        permanent: true,
      },
      request: req,
    });
    res.status(204).json({ message: "Patient permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error permanently deleting patient" });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    // if (
    //   !req.user ||
    //   (!hasPermission(req.user, "/dashboard/patients:read") &&
    //     req.user.role !== "admin")
    // ) {
    //   return res.status(403).json({ message: "Forbidden" });
    // }

    const { page = 1, limit = 10, search, gender, ageMin, ageMax, contact, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query with role-based filtering
    const query = buildRoleBasedQuery(req, {});
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: search,
              options: 'i'
            }
          }
        }
      ];
    }
    
    // Filter by gender
    if (gender) {
      query.gender = gender;
    }
    
    // Filter by contact
    if (contact) {
      query.contact = { $regex: contact, $options: 'i' };
    }
    
    // Age range filter
    if (ageMin || ageMax) {
      query.age = {};
      if (ageMin) query.age.$gte = parseInt(ageMin);
      if (ageMax) query.age.$lte = parseInt(ageMax);
    }
    
    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const patients = await Patient.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count for pagination
    const total = await Patient.countDocuments(query);

    const mappedPatients = patients.map((patient) => {
      const patientObj = patient.toObject();
      delete patientObj.__v;
      return patientObj;
    });
    
    res.json({
      success: true,
      data: mappedPatients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching patients" });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/patients:read") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all patients
exports.deleteAllPatients = async (req, res) => {
  try {
    await Patient.deleteMany({});
    res.json({ success: true, message: 'All patients deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
