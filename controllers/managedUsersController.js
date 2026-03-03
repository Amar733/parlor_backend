const ManagedUser = require("../models/ManagedUser");
const { upload } = require("../middleware/upload");
const LogService = require("../services/logService");
const FileManager = require("../services/fileManager");
const bcrypt = require("bcryptjs");

// Helper function to check permissions (similar to your hasPermission)
const hasPermission = (user, permission) => {
  if (user.role === "admin") return true;
  return user.permissions && user.permissions.includes(permission);
};

// Helper function to map user object (convert _id to id, remove sensitive fields)
const mapUser = (user) => {
  if (!user) return user;
  const obj = user.toObject ? user.toObject() : user;
  //delete obj._id;
  delete obj.__v;
  delete obj.password; // never send password
  return obj;
};

// GET /api/users
exports.getAllManagedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = { role: { $ne: 'vendor' } };
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }
    const users = await ManagedUser.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await ManagedUser.countDocuments(query);
    const mappedUsers = users.map(mapUser);
    res.json(mappedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users
exports.createManagedUser = async (req, res) => {
  try {
    // if (
    //   !req.user ||
    //   (!hasPermission(req.user, "/dashboard/users:edit") &&
    //     req.user.role !== "admin")
    // ) {
    //   return res.status(403).json({ message: "Forbidden" });
    // }
    const {
      name,
      email,
      mobileNo,
      userPhoto,
      parlorPhotos,
      establishmentYear,
      gender,
      services,
      city,
      state,
      pincode,
      businessLicense,
      gstNumber,
      panNumber,
      account_Number,
      ifsc_code,
      bank_name,
      register_fees,

      role,
      password,
      permissions,
      specialization,
      bio,
      availableSlots,
      avatarUrl,
      companyName,
      phone,
      pan,
      stateCode,
      creditDays,
      creditLimit,
      openingBalance,
      address
    } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const existingUser = await ManagedUser.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }
    let userAvatarUrl;
    if (req.file) {
      userAvatarUrl = `/uploads/${req.file.filename}`;
    } else if (avatarUrl) {
      userAvatarUrl = avatarUrl;
    } else {
      userAvatarUrl = "https://placehold.co/100x100.png";
    }
    
    const userData = {
      name,
      email,
      mobileNo,
      userPhoto,
      parlorPhotos,
      establishmentYear,
      gender,
      services,
      city,
      state,
      pincode,
      businessLicense,
      gstNumber,
      panNumber,
      account_Number,
      ifsc_code,
      bank_name,
      register_fees,
      role,
      permissions: permissions || [],
      avatarUrl: userAvatarUrl,
      specialization: specialization || "",
      bio: bio || "",
      availableSlots: availableSlots || [],
      companyName: companyName || "",
      phone: phone || "",
      gstNumber: gstNumber || "",
      pan: pan || "",
      stateCode: stateCode || "",
      creditDays: creditDays || 0,
      creditLimit: creditLimit || 0,
      openingBalance: openingBalance || 0,
      address: address || ""
    };
    
    // Only hash and include password if provided
    if (password) {
      const saltRounds = 10;
      userData.password = await bcrypt.hash(password, saltRounds);
    }
    const newUser = new ManagedUser(userData);
    await newUser.save();
    await LogService.logActivity({
      actor: req.user,
      action: "CREATE_USER",
      entity: {
        type: "User",
        id: newUser._id.toString(),
        name: newUser.name,
      },
      details: {
        createdUser: {
          ...newUser.toObject(),
          password: "***",
        },
      },
      request: req,
    });
    const responseUser = mapUser(newUser);
    res.status(201).json(responseUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: "Error creating user" });
  }
};
exports.createManagedUserBulk = async (req, res) => {
  try { 
    const {
      name,
      email,
      role,
      password,
      permissions,
      specialization,
      bio,
      availableSlots,
      avatarUrl,
      companyName,
      phone,
      gstNumber,
      pan,
      stateCode,
      creditDays,
      creditLimit,
      openingBalance,
      old_id,
      address
    } = req.body;
    if (!name  || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    let userAvatarUrl;
    if (req.file) {
      userAvatarUrl = `/uploads/${req.file.filename}`;
    } else if (avatarUrl) {
      userAvatarUrl = avatarUrl;
    } else {
      userAvatarUrl = "https://placehold.co/100x100.png";
    }
    
    const userData = {
      name,
      email,
      role,
      permissions: permissions || [],
      avatarUrl: userAvatarUrl,
      specialization: specialization || "",
      bio: bio || "",
      availableSlots: availableSlots || [],
      companyName: companyName || "",
      phone: phone || "",
      gstNumber: gstNumber || "",
      pan: pan || "",
      stateCode: stateCode || "",
      creditDays: creditDays || 0,
      creditLimit: creditLimit || 0,
      openingBalance: openingBalance || 0,
      old_id: old_id || "",
      address: address || ""
    };
    
    // Only hash and include password if provided
    if (password) {
      const saltRounds = 10;
      userData.password = await bcrypt.hash(password, saltRounds);
    }
    const newUser = new ManagedUser(userData);
    await newUser.save();
    await LogService.logActivity({
      actor: req.user,
      action: "CREATE_USER",
      entity: {
        type: "User",
        id: newUser._id.toString(),
        name: newUser.name,
      },
      details: {
        createdUser: {
          ...newUser.toObject(),
          password: "***",
        },
      },
      request: req,
    });
    const responseUser = mapUser(newUser);
    res.status(201).json(responseUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: "Error creating user" });
  }
};

// GET /api/users/doctors
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await ManagedUser.find({ role: "doctor" }).select(
      "name email specialization bio availableSlots avatarUrl createdAt"
    );
    const mappedDoctors = doctors.map(mapUser);
    res.json(mappedDoctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/:id
exports.getManagedUserById = async (req, res) => {
  try {
    const user = await ManagedUser.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const mappedUser = mapUser(user);
    res.json(mappedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/:id
exports.updateManagedUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user._id.toString() !== id)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const currentUser = await ManagedUser.findById(id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const updateData = { ...req.body };
    if (req.file) {
      if (
        currentUser.avatarUrl &&
        !currentUser.avatarUrl.includes("placehold.co")
      ) {
        await FileManager.moveFileToBin(currentUser.avatarUrl);
      }
      updateData.avatarUrl = `/uploads/${req.file.filename}`;
    } else if (
      updateData.avatarUrl &&
      updateData.avatarUrl !== currentUser.avatarUrl
    ) {
      if (
        currentUser.avatarUrl &&
        !currentUser.avatarUrl.includes("placehold.co")
      ) {
        await FileManager.moveFileToBin(currentUser.avatarUrl);
      }
    }
    if (updateData.password === "" || updateData.password === undefined) {
      delete updateData.password;
    } else if (updateData.password) {
      // Hash the new password if provided
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }
    
    if (
      updateData.availableSlots &&
      typeof updateData.availableSlots === "string"
    ) {
      try {
        updateData.availableSlots = JSON.parse(updateData.availableSlots);
      } catch (e) {
        updateData.availableSlots = [updateData.availableSlots];
      }
    }
    let updatedUser;
    if (updateData.password) {
      Object.assign(currentUser, updateData);
      updatedUser = await currentUser.save();
      updatedUser = await ManagedUser.findById(id).select("-password");
    } else {
      updatedUser = await ManagedUser.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");
    }
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const logDetails = { ...updateData };
    if (logDetails.password) {
      logDetails.password = "updated";
    }
    if (logDetails.availableSlots) {
      logDetails.availableSlots = `updated to ${logDetails.availableSlots.length} slots`;
    }
    await LogService.logActivity({
      actor: req.user,
      action: "UPDATE_USER",
      entity: {
        type: "User",
        id: updatedUser._id.toString(),
        name: updatedUser.name,
      },
      details: logDetails,
      request: req,
    });
    const mappedUser = mapUser(updatedUser);
    res.json(mappedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: "Error updating user" });
  }
};


// DELETE /api/users/:id
exports.deleteManagedUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userToDelete = await ManagedUser.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }
    if (
      userToDelete.avatarUrl &&
      !userToDelete.avatarUrl.includes("placehold.co")
    ) {
      await FileManager.moveFileToBin(userToDelete.avatarUrl);
    }
    const deletedUser = await ManagedUser.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    await LogService.logActivity({
      actor: req.user,
      action: "DELETE_USER",
      entity: {
        type: "User",
        id: userToDelete._id.toString(),
        name: userToDelete.name,
      },
      details: {
        deletedUser: {
          name: userToDelete.name,
          email: userToDelete.email,
          role: userToDelete.role,
        },
      },
      request: req,
    });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

// PATCH /api/users/:id/permissions
exports.updateUserPermissions = async (req, res) => {
  try {
    // Check if user has permission to update user permissions
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/users:edit") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: "Permissions must be an array" });
    }
    
    const user = await ManagedUser.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true, runValidators: true }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    await LogService.logActivity({
      actor: req.user,
      action: "UPDATE_USER_PERMISSIONS",
      entity: {
        type: "User",
        id: user._id.toString(),
        name: user.name,
      },
      details: {
        newPermissions: permissions,
        permissionCount: permissions.length,
      },
      request: req,
    });
    
    const mappedUser = mapUser(user);
    res.json(mappedUser);
  } catch (error) {
    console.error('Error updating user permissions:', error);
    res.status(500).json({ message: error.message });
  }
};


// GET /api/users/vendors
exports.getVendors = async (req, res) => {
  try {
    const vendors = await ManagedUser.find({ role: "vendor" }).select(
      "name email phone address companyName gstNumber pan stateCode creditDays creditLimit openingBalance createdAt"
    );
    res.json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


   