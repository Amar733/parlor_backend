const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// A simple map for common MIME types
const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.json': 'application/json'
};

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + sanitizedName);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|txt|mp4|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, SVG, PDF, DOC, DOCX, TXT, MP4, WEBM, and OGG files are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: process.env.MAX_FILE_SIZE || 5000000 // 5MB
    },
    fileFilter: fileFilter
});

// Backup upload configuration
const backupStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const backupDir = path.join(process.cwd(), 'backups', 'json');
        cb(null, backupDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const backupUpload = multer({
    storage: backupStorage,
    limits: { fileSize: 50000000 }, // 50MB
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.json') || file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Only .json and .zip files allowed'));
        }
    }
});

// File serving middleware with security
const serveFile = async (req, res) => {
    try {
        const requestedFilename = req.params.filename;

        // Prevent directory traversal attacks
        if (requestedFilename.includes('..') || requestedFilename.includes('/') || requestedFilename.includes('\\')) {
            return res.status(400).json({ message: 'Invalid path' });
        }

        const filePath = path.join(uploadsDir, requestedFilename);

        // Check if file exists and read it
        const fileBuffer = await fs.readFile(filePath);

        // Determine the content type from the file extension
        const extension = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[extension] || 'application/octet-stream';

        // Set headers and send file
        res.set({
            'Content-Type': contentType,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        });

        res.send(fileBuffer);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ message: 'File not found' });
        }
        console.error(`Error serving file: ${req.params.filename}`, error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { upload, backupUpload, serveFile, mimeTypes };










