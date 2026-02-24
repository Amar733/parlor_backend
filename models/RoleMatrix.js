const mongoose = require("mongoose");

const roleMatrixSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    allpermissions: [
      {
        id: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        actions: [
          {
            type: String,
            enum: ["view", "edit", "delete"],
            required: true,
          },
        ],
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better performance

roleMatrixSchema.index({ is_active: 1 });
roleMatrixSchema.index({ deletedAt: 1 });

// Removed pre-save middleware for role_name capitalization

// Instance method to get active permissions
roleMatrixSchema.methods.getActivePermissions = function () {
  return this.allpermissions.filter(
    (permission) => permission.actions && permission.actions.length > 0
  );
};

// Static method to find active roles
roleMatrixSchema.statics.findActiveRoles = function () {
  return this.find({
    is_active: true,
    deletedAt: null,
  });
};

module.exports = mongoose.model("RoleMatrix", roleMatrixSchema, "role_matrix");
