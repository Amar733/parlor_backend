const express = require("express");
const router = express.Router();
const RoleMatrixController = require("../controllers/roleMatrixController");
const { auth } = require("../middleware/auth");

// GET routes
router.get("/", auth, RoleMatrixController.getAllRoles);

// POST routes
router.post("/", auth, RoleMatrixController.createRole);

// PUT routes
router.put("/:id", auth, RoleMatrixController.updateRole);
router.put("/:id/restore", auth, RoleMatrixController.restoreRole);

// DELETE routes
router.delete("/:id", auth, RoleMatrixController.deleteRole);

module.exports = router;
