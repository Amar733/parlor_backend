const express = require("express");
const fileServerController = require("../controllers/fileServerController");
const router = express.Router();

// @route   GET /uploads/:filename
// @desc    Serve uploaded files
// @access  Public (but logged)
router.get("/:filename", fileServerController.serveFile);

// @route   GET /uploads/public/:filename
// @desc    Serve public uploaded files
// @access  Public
router.get("/public/:filename", fileServerController.servePublicFile);

// @route   HEAD /uploads/:filename
// @desc    Get file metadata without downloading
// @access  Public
router.head("/:filename", fileServerController.fileMetadata);

module.exports = router;
