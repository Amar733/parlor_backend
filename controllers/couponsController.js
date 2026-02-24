const Coupon = require("../models/Coupon");
const LogService = require("../services/logService");

const hasPermission = (user, permission) => {
  if (user.role === "admin") return true;
  return user.permissions && user.permissions.includes(permission);
};

exports.getAllCoupons = async (req, res) => {
  try {
    const { status, code } = req.query;
    const query = {};
    if (status) query.status = status;
    if (code) query.code = { $regex: code, $options: "i" };
    const coupons = await Coupon.find(query).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching coupons" });
  }
};

exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      code: req.params.code,
      status: "Active",
    });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid or expired coupon" });
    }
    const currentDate = new Date().toISOString().split("T")[0];
    if (coupon.expiryDate < currentDate) {
      coupon.status = "Expired";
      await coupon.save();
      return res.status(400).json({ message: "Coupon has expired" });
    }
    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        discountType: coupon.discountType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/coupons:create") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { code, discount, discountType, expiryDate, status } = req.body;
    if (
      !code ||
      discount === undefined ||
      !discountType ||
      !expiryDate ||
      !status
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const couponData = { code, discount, discountType, expiryDate, status };
    const coupon = new Coupon(couponData);
    const createdCoupon = await coupon.save();
    await LogService.logActivity({
      actor: req.user,
      action: "CREATE_COUPON",
      entity: {
        type: "Coupon",
        id: createdCoupon._id.toString(),
        name: createdCoupon.code,
      },
      details: { coupon: createdCoupon.toObject() },
      request: req,
    });
    res.status(201).json({
      success: true,
      data: createdCoupon,
      message: "Coupon created successfully",
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ success: false, message: "Error creating coupon" });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/coupons:edit") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { id } = req.params;
    const currentCoupon = await Coupon.findById(id);
    if (!currentCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    await LogService.logActivity({
      actor: req.user,
      action: "UPDATE_COUPON",
      entity: {
        type: "Coupon",
        id: updatedCoupon._id.toString(),
        name: updatedCoupon.code,
      },
      details: {
        previousData: currentCoupon.toObject(),
        updatedData: req.body,
      },
      request: req,
    });
    res.json({
      success: true,
      data: updatedCoupon,
      message: "Coupon updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating coupon" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/coupons:delete") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const { id } = req.params;
    const couponToDelete = await Coupon.findById(id);
    if (!couponToDelete) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    await LogService.logActivity({
      actor: req.user,
      action: "DELETE_COUPON",
      entity: {
        type: "Coupon",
        id: id,
        name: couponToDelete.code,
      },
      details: {
        deletedCoupon: {
          code: couponToDelete.code,
          discount: couponToDelete.discount,
          discountType: couponToDelete.discountType,
          status: couponToDelete.status,
        },
      },
      request: req,
    });
    res
      .status(204)
      .json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting coupon" });
  }
};

exports.updateCouponStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
