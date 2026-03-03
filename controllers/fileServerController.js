const path = require("path");
const fs = require("fs").promises;
const { createReadStream } = require("fs");
const LogService = require("../services/logService");

// GET /uploads/:filename
exports.serveFile = async (req, res) => {
  try {
    const { filename } = req.params;

    // Security check: ensure filename doesn't contain path traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const filePath = path.join(process.cwd(), "uploads", filename);

    try {
      // Check if file exists and get stats
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Get file extension to set proper content type
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";

      // Set headers
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

      // Handle range requests for large files
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = end - start + 1;

        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${stats.size}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", chunksize);

        const stream = createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        // Serve the entire file
        const stream = createReadStream(filePath);
        stream.pipe(res);
      }

      // Log file access (non-blocking)
      // LogService.logActivity({
      //   actor: null, // Public access, no user
      //   action: "FILE_ACCESS",
      //   entity: {
      //     type: "File",
      //     id: filename,
      //     name: filename,
      //   },
      //   details: {
      //     filename: filename,
      //     size: stats.size,
      //     contentType: contentType,
      //     userAgent: req.headers["user-agent"] || "unknown",
      //   },
      //   request: req,
      // }).catch((err) => {
      //   console.error("Error logging file access:", err);
      //   // Don't fail the request if logging fails
      // });
    } catch (fileError) {
      if (fileError.code === "ENOENT") {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }
      throw fileError;
    }
  } catch (error) {
    console.error("File serving error:", error);
    return res.status(500).json({
      success: false,
      message: "Error serving file: " + error.message,
    });
  }
};

// GET /uploads/public/:filename
exports.servePublicFile = async (req, res) => {
  try {
    const { filename } = req.params;

    // Security check: ensure filename doesn't contain path traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid filename",
      });
    }

    const filePath = path.join(process.cwd(), ".publicUploads", filename);

    try {
      // Check if file exists and get stats
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Get file extension to set proper content type
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";

      // Set headers
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

      // Handle range requests for large files
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = end - start + 1;

        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${stats.size}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", chunksize);

        const stream = createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        // Create read stream and pipe to response
        const stream = createReadStream(filePath);
        stream.pipe(res);
      }

      // Log public file access (without user context)
      // LogService.logActivity({
      //   actor: { id: "public", name: "Public User", email: "public@system" },
      //   action: "PUBLIC_FILE_ACCESS",
      //   entity: {
      //     type: "PublicFile",
      //     id: filename,
      //     name: filename,
      //   },
      //   details: {
      //     filename: filename,
      //     filePath: filePath,
      //     fileSize: stats.size,
      //     contentType: contentType,
      //   },
      //   request: req,
      // }).catch((err) => {
      //   console.error("Error logging public file access:", err);
      //   // Don't fail the request if logging fails
      // });
    } catch (fileError) {
      if (fileError.code === "ENOENT") {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }
      throw fileError;
    }
  } catch (error) {
    console.error("Public file serving error:", error);
    return res.status(500).json({
      success: false,
      message: "Error serving file: " + error.message,
    });
  }
};

// HEAD /uploads/:filename
exports.fileMetadata = async (req, res) => {
  try {
    const { filename } = req.params;

    // Security check
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).end();
    }

    const filePath = path.join(process.cwd(), "uploads", filename);

    try {
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return res.status(404).end();
      }

      // Get file extension to set proper content type
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";

      // Set headers
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Last-Modified", stats.mtime.toUTCString());
      res.setHeader("Cache-Control", "public, max-age=31536000");

      res.status(200).end();
    } catch (fileError) {
      if (fileError.code === "ENOENT") {
        return res.status(404).end();
      }
      throw fileError;
    }
  } catch (error) {
    console.error("File metadata error:", error);
    return res.status(500).end();
  }
};
