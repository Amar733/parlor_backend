const path = require("path");
const fs = require("fs").promises;
const LogService = require("../services/logService");

exports.uploadSingleFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file found" });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/\s/g, "_");
    const filename = `${timestamp}-${cleanName}`;

    // Store files in a private .uploads directory at the project root
    const uploadsPath = path.join(process.cwd(), ".uploads");
    const filePath = path.join(uploadsPath, filename);

    try {
      // Ensure the uploads directory exists
      await fs.mkdir(uploadsPath, { recursive: true });

      // Write the file to the server
      await fs.writeFile(filePath, file.buffer);

      // The public URL will be handled by our dynamic file server route
      const fileUrl = `/uploads/${filename}`;

      // Log the file upload activity
      await LogService.logActivity({
        actor: req.user,
        action: "FILE_UPLOAD",
        entity: {
          type: "File",
          id: filename,
          name: file.originalname,
        },
        details: {
          originalName: file.originalname,
          filename: filename,
          size: file.size,
          mimetype: file.mimetype,
          url: fileUrl,
        },
        request: req,
      });

      return res.json({
        url: fileUrl,
        filename: filename,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
      });
    } catch (error) {
      console.error("Error saving file:", error);
      return res.status(500).json({ message: "Error saving file" });
    }
  } catch (error) {
    console.error("File upload error:", error);

    // Handle multer errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 10MB." });
    }

    if (error.message.includes("Invalid file type")) {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Error uploading file: " + error.message });
  }
};

exports.uploadPublicFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file found" });
    }

    // Generate a unique filename with better encoding handling
    const timestamp = Date.now();
    // Remove special characters and normalize the filename
    const cleanName = file.originalname
      .normalize("NFD") // Normalize Unicode
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^\w\s.-]/gi, "") // Remove special characters except word chars, spaces, dots, hyphens
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase(); // Convert to lowercase for consistency
    const filename = `${timestamp}-${cleanName}`;

    // Store public files in a separate .publicUploads directory
    const uploadsPath = path.join(process.cwd(), ".publicUploads");
    const filePath = path.join(uploadsPath, filename);

    try {
      // Ensure the public uploads directory exists
      await fs.mkdir(uploadsPath, { recursive: true });

      // Write the file to the server
      await fs.writeFile(filePath, file.buffer);

      // The public URL for public uploads
      const fileUrl = `/uploads/public/${filename}`;

      // Log the public file upload activity (without user context)
      await LogService.logActivity({
        actor: { id: "public", name: "Public User", email: "public@system" },
        action: "PUBLIC_FILE_UPLOAD",
        entity: {
          type: "PublicFile",
          id: filename,
          name: file.originalname,
        },
        details: {
          originalName: file.originalname,
          filename: filename,
          size: file.size,
          mimetype: file.mimetype,
          url: fileUrl,
        },
        request: req,
      });

      return res.json({
        url: fileUrl,
        filename: filename,
        originalName: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
      });
    } catch (error) {
      console.error("Error saving public file:", error);
      return res.status(500).json({ message: "Error saving file" });
    }
  } catch (error) {
    console.error("Public file upload error:", error);

    // Handle multer errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File too large. Maximum size is 10MB." });
    }

    if (error.message.includes("Invalid file type")) {
      return res.status(400).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Error uploading file: " + error.message });
  }
};

exports.uploadMultipleFiles = async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files found" });
    }

    const uploadedFiles = [];
    const uploadsPath = path.join(process.cwd(), ".uploads");

    // Ensure the uploads directory exists
    await fs.mkdir(uploadsPath, { recursive: true });

    for (const file of files) {
      // Generate a unique filename for each file
      const timestamp = Date.now();
      const cleanName = file.originalname.replace(/\s/g, "_");
      const filename = `${timestamp}-${Math.random()
        .toString(36)
        .substr(2, 9)}-${cleanName}`;

      const filePath = path.join(uploadsPath, filename);

      try {
        // Write the file to the server
        await fs.writeFile(filePath, file.buffer);

        const fileUrl = `/uploads/${filename}`;

        uploadedFiles.push({
          url: fileUrl,
          filename: filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        });

        // Log each file upload
        await LogService.logActivity({
          actor: req.user,
          action: "FILE_UPLOAD",
          entity: {
            type: "File",
            id: filename,
            name: file.originalname,
          },
          details: {
            originalName: file.originalname,
            filename: filename,
            size: file.size,
            mimetype: file.mimetype,
            url: fileUrl,
            batchUpload: true,
          },
          request: req,
        });
      } catch (fileError) {
        console.error(`Error saving file ${file.originalname}:`, fileError);
        // Continue with other files, but log the error
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ message: "Failed to upload any files" });
    }

    return res.json({
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} out of ${files.length} files`,
    });
  } catch (error) {
    console.error("Multiple file upload error:", error);
    return res
      .status(500)
      .json({ message: "Error uploading files: " + error.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;

    // Security check: ensure filename doesn't contain path traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const filePath = path.join(process.cwd(), ".uploads", filename);

    try {
      // Check if file exists
      await fs.access(filePath);

      // Delete the file
      await fs.unlink(filePath);

      // Log the file deletion
      await LogService.logActivity({
        actor: req.user,
        action: "FILE_DELETE",
        entity: {
          type: "File",
          id: filename,
          name: filename,
        },
        details: {
          filename: filename,
          filePath: filePath,
        },
        request: req,
      });

      return res.json({ message: "File deleted successfully" });
    } catch (fileError) {
      if (fileError.code === "ENOENT") {
        return res.status(404).json({ message: "File not found" });
      }
      throw fileError;
    }
  } catch (error) {
    console.error("File deletion error:", error);
    return res
      .status(500)
      .json({ message: "Error deleting file: " + error.message });
  }
};
