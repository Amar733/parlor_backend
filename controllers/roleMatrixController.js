const RoleMatrix = require("../models/RoleMatrix");
const LogService = require("../services/logService");

class RoleMatrixController {
  // Get all roles
  static async getAllRoles(req, res) {
    try {
      const roles = await RoleMatrix.findActiveRoles().select("-deletedAt");

      res.status(200).json({
        success: true,
        message: "Roles retrieved successfully",
        data: roles,
        count: roles.length,
      });
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving roles",
        error: error.message,
      });
    }
  }

  // Get role by ID
  static async getRoleById(req, res) {
    try {
      const { id } = req.params;

      const role = await RoleMatrix.findOne({
        _id: id,
        deletedAt: null,
      }).select("-deletedAt");

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Role retrieved successfully",
        data: role,
      });
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving role",
        error: error.message,
      });
    }
  }

  // Create new role
  static async createRole(req, res) {
    try {
      const { role_name, allpermissions } = req.body;

      // Validate required fields
      if (!role_name || !allpermissions) {
        return res.status(400).json({
          success: false,
          message: "Role name and permissions are required",
        });
      }

      // Check if role already exists (case-insensitive, but store as provided)
      const existingRole = await RoleMatrix.findOne({
        role_name: role_name,
        deletedAt: null,
      });

      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: "Role with this name already exists",
        });
      }

      // Create new role
      const newRole = new RoleMatrix({
        role_name,
        allpermissions,
      });

      await newRole.save();

      // Log activity
      if (req.user && req.user.id) {
        await LogService.logActivity(
          req.user.id,
          "create",
          "RoleMatrix",
          newRole._id.toString(),
          { role_name, permissions_count: allpermissions.length }
        );
      }

      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: newRole,
      });
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({
        success: false,
        message: "Error creating role",
        error: error.message,
      });
    }
  }

  // Update role
  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { role_name, allpermissions, is_active } = req.body;

      // Find the role
      const role = await RoleMatrix.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      // Check for duplicate name if role_name is being updated
      if (role_name && role_name !== role.role_name) {
        const existingRole = await RoleMatrix.findOne({
          role_name: role_name,
          _id: { $ne: id },
          deletedAt: null,
        });

        if (existingRole) {
          return res.status(409).json({
            success: false,
            message: "Role with this name already exists",
          });
        }
      }

      // Update fields
      if (role_name) role.role_name = role_name;
      if (allpermissions) role.allpermissions = allpermissions;
      if (typeof is_active !== "undefined") role.is_active = is_active;

      await role.save();

      // Log activity
      if (req.user && req.user.id) {
        await LogService.logActivity(
          req.user.id,
          "update",
          "RoleMatrix",
          role._id.toString(),
          {
            role_name: role.role_name,
            permissions_count: role.allpermissions.length,
            is_active: role.is_active,
          }
        );
      }

      res.status(200).json({
        success: true,
        message: "Role updated successfully",
        data: role,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({
        success: false,
        message: "Error updating role",
        error: error.message,
      });
    }
  }

  // Soft delete role
  static async deleteRole(req, res) {
    try {
      const { id } = req.params;

      // Find the role
      const role = await RoleMatrix.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found or already deleted",
        });
      }

      // Soft delete
      role.deletedAt = new Date();
      role.is_active = false;
      await role.save();

      // Log activity
      if (req.user && req.user.id) {
        await LogService.logActivity(
          req.user.id,
          "delete",
          "RoleMatrix",
          role._id.toString(),
          { role_name: role.role_name }
        );
      }

      res.status(200).json({
        success: true,
        message: "Role deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting role",
        error: error.message,
      });
    }
  }

  // Restore deleted role
  static async restoreRole(req, res) {
    try {
      const { id } = req.params;

      // Find the deleted role
      const role = await RoleMatrix.findOne({
        _id: id,
        deletedAt: { $ne: null },
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Deleted role not found",
        });
      }

      // Check if active role with same name exists
      const existingActiveRole = await RoleMatrix.findOne({
        role_name: role.role_name,
        _id: { $ne: id },
        deletedAt: null,
      });

      if (existingActiveRole) {
        return res.status(409).json({
          success: false,
          message: "Cannot restore: Active role with this name already exists",
        });
      }

      // Restore role
      role.deletedAt = null;
      role.is_active = true;
      await role.save();

      // Log activity
      if (req.user && req.user.id) {
        await LogService.logActivity(
          req.user.id,
          "restore",
          "RoleMatrix",
          role._id.toString(),
          { role_name: role.role_name }
        );
      }

      res.status(200).json({
        success: true,
        message: "Role restored successfully",
        data: role,
      });
    } catch (error) {
      console.error("Error restoring role:", error);
      res.status(500).json({
        success: false,
        message: "Error restoring role",
        error: error.message,
      });
    }
  }

  // Get deleted roles
  static async getDeletedRoles(req, res) {
    try {
      const deletedRoles = await RoleMatrix.find({
        deletedAt: { $ne: null },
      }).select("-__v");

      res.status(200).json({
        success: true,
        message: "Deleted roles retrieved successfully",
        data: deletedRoles,
        count: deletedRoles.length,
      });
    } catch (error) {
      console.error("Error fetching deleted roles:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving deleted roles",
        error: error.message,
      });
    }
  }

  // Get role statistics
  static async getRoleStatistics(req, res) {
    try {
      const totalRoles = await RoleMatrix.countDocuments({ deletedAt: null });
      const activeRoles = await RoleMatrix.countDocuments({
        deletedAt: null,
        is_active: true,
      });
      const inactiveRoles = await RoleMatrix.countDocuments({
        deletedAt: null,
        is_active: false,
      });
      const deletedRoles = await RoleMatrix.countDocuments({
        deletedAt: { $ne: null },
      });

      res.status(200).json({
        success: true,
        message: "Role statistics retrieved successfully",
        data: {
          total: totalRoles,
          active: activeRoles,
          inactive: inactiveRoles,
          deleted: deletedRoles,
        },
      });
    } catch (error) {
      console.error("Error fetching role statistics:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving role statistics",
        error: error.message,
      });
    }
  }
}

module.exports = RoleMatrixController;
