const express = require("express");
const multer = require("multer");
const { auth } = require("../middleware/auth");
const uploadController = require("../controllers/uploadController");
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory temporarily

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file types - including WebP
    const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|pdf|doc|docx|txt)$/i;
    const allowedMimetypes = [
      // Image formats
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      // Document formats
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    const extname = allowedExtensions.test(file.originalname);
    const mimetype = allowedMimetypes.includes(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      console.log(
        `File rejected - Name: ${file.originalname}, Mimetype: ${file.mimetype}`
      );
      cb(
        new Error(
          "Invalid file type. Only images (JPEG, PNG, GIF, WebP), PDFs, and documents are allowed."
        )
      );
    }
  },
});

// @route   POST /api/upload
// @desc    Upload a file
// @access  Private (requires authentication)
router.post(
  "/",
  auth,
  upload.single("file"),
  uploadController.uploadSingleFile
);

// @route   POST /api/upload/public
// @desc    Upload a file (public access for appointment bookings)
// @access  Public (no authentication required)
router.post(
  "/public",
  upload.single("file"),
  uploadController.uploadPublicFile
);

// @route   POST /api/upload/multiple
// @desc    Upload multiple files
// @access  Private (requires authentication)
router.post(
  "/multiple",
  auth,
  upload.array("files", 10),
  uploadController.uploadMultipleFiles
);

// @route   DELETE /api/upload/:filename
// @desc    Delete an uploaded file
// @access  Private (requires authentication)
router.delete("/:filename", auth, uploadController.deleteFile);

module.exports = router;
