# File Management System Documentation

The File Management System provides safe file deletion by moving files to a bin directory instead of permanently deleting them, allowing for file recovery and better data management.

## Features

- **Soft Delete**: Move files to bin instead of permanent deletion
- **File Recovery**: Restore files from bin back to uploads
- **Bulk Operations**: Handle multiple files at once
- **Automatic Cleanup**: Remove old files from bin based on age
- **Admin Interface**: Full management interface for administrators
- **Activity Logging**: All operations are logged for audit purposes

## Structure

```
project_root/
├── uploads/          # Active files
├── .bin/            # Deleted files (with timestamps)
└── ...
```

## Usage

### 1. Basic File Deletion (Move to Bin)

```javascript
const FileManager = require("../services/fileManager");

// Move a single file to bin
const result = await FileManager.moveFileToBin("/uploads/document.pdf");

if (result.success) {
  console.log(`File moved to bin: ${result.binPath}`);
} else {
  console.log(`Failed to move file: ${result.reason}`);
}
```

### 2. Integration in Routes

```javascript
// Example: Delete blood report with file management
router.delete("/:id", auth, authorize("admin", "doctor"), async (req, res) => {
  try {
    const bloodReport = await BloodReport.findById(req.params.id);

    // Move associated file to bin
    if (bloodReport.fileUrl) {
      await FileManager.moveFileToBin(bloodReport.fileUrl);
    }

    // Soft delete the record
    await BloodReport.findByIdAndUpdate(req.params.id, {
      deletedAt: new Date(),
    });

    res.json({ message: "Blood report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

### 3. Bulk File Operations

```javascript
// Move multiple files to bin
const fileUrls = ["/uploads/file1.pdf", "/uploads/file2.jpg"];
const results = await FileManager.moveMultipleFilesToBin(fileUrls);

console.log(`Successfully moved: ${results.success.length}`);
console.log(`Failed to move: ${results.failed.length}`);
```

### 4. File Recovery

```javascript
// Restore a specific file
const result = await FileManager.restoreFileFromBin(
  "2025-01-29T10-30-00-000Z_document.pdf", // Bin filename
  "document.pdf" // Original filename (optional)
);

if (result.success) {
  console.log(`File restored to: /uploads/${result.restoredFilename}`);
}
```

## API Endpoints

All bin management endpoints require admin authentication.

### List Files in Bin

```http
GET /api/bin?limit=20&sortBy=date&order=desc
```

**Response:**

```json
{
  "success": true,
  "data": {
    "files": [
      {
        "binFilename": "2025-01-29T10-30-00-000Z_document.pdf",
        "originalFilename": "document.pdf",
        "size": 1024000,
        "deletedAt": "2025-01-29T10:30:00.000Z"
      }
    ],
    "total": 1,
    "binDirectory": "/path/to/.bin"
  }
}
```

### Restore File from Bin

```http
POST /api/bin/restore
Content-Type: application/json

{
    "binFilename": "2025-01-29T10-30-00-000Z_document.pdf",
    "originalFilename": "document.pdf"  // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "File restored successfully",
  "data": {
    "restoredFilename": "document.pdf",
    "restoredUrl": "/uploads/document.pdf",
    "renamed": false
  }
}
```

### Permanently Delete Files

```http
DELETE /api/bin/permanent
Content-Type: application/json

{
    "filenames": [
        "2025-01-29T10-30-00-000Z_document.pdf",
        "2025-01-29T11-00-00-000Z_image.jpg"
    ]
}
```

### Cleanup Old Files

```http
POST /api/bin/cleanup
Content-Type: application/json

{
    "daysOld": 30
}
```

### Get Bin Statistics

```http
GET /api/bin/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalFiles": 5,
    "totalSize": 5120000,
    "oldestFile": {
      "binFilename": "2025-01-01T10-00-00-000Z_old.pdf",
      "deletedAt": "2025-01-01T10:00:00.000Z"
    },
    "newestFile": {
      "binFilename": "2025-01-29T10-30-00-000Z_new.pdf",
      "deletedAt": "2025-01-29T10:30:00.000Z"
    }
  }
}
```

## File Naming Convention

When files are moved to bin, they are renamed with a timestamp prefix to avoid conflicts:

```
Original: document.pdf
In Bin:   2025-01-29T10-30-00-000Z_document.pdf
```

The timestamp format: `YYYY-MM-DDTHH-mm-ss-sssZ_originalname`

## Integration Examples

### Portfolio Items with Images

```javascript
// In portfolio routes
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    const portfolioItem = await PortfolioItem.findById(req.params.id);

    // Move image to bin
    if (portfolioItem.imageUrl) {
      await FileManager.moveFileToBin(portfolioItem.imageUrl);
    }

    await PortfolioItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Portfolio item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

### User Avatar Cleanup

```javascript
// When updating user avatar
router.put("/:id", auth, upload.single("avatar"), async (req, res) => {
  try {
    const user = await ManagedUser.findById(req.params.id);

    // If uploading new avatar, move old one to bin
    if (req.file && user.avatarUrl) {
      await FileManager.moveFileToBin(user.avatarUrl);
    }

    const updateData = {
      ...req.body,
      avatarUrl: req.file ? `/uploads/${req.file.filename}` : user.avatarUrl,
    };

    const updatedUser = await ManagedUser.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
```

## Best Practices

### 1. Always Check for Files Before Database Deletion

```javascript
// Good practice
const record = await Model.findById(id);
if (record.fileUrl) {
  await FileManager.moveFileToBin(record.fileUrl);
}
await Model.findByIdAndDelete(id);
```

### 2. Handle Multiple Files

```javascript
// For records with multiple files
const fileUrls = [record.fileUrl, record.thumbnailUrl].filter(Boolean);
if (fileUrls.length > 0) {
  await FileManager.moveMultipleFilesToBin(fileUrls);
}
```

### 3. Bulk Cleanup Operations

```javascript
// Set up periodic cleanup (e.g., monthly cron job)
const cleanupResult = await FileManager.cleanupOldBinFiles(30); // 30 days
console.log(`Cleaned up ${cleanupResult.deleted.length} old files`);
```

### 4. Error Handling

```javascript
// Always handle file operation errors gracefully
try {
  const result = await FileManager.moveFileToBin(fileUrl);
  if (!result.success && result.reason !== "file_not_found") {
    console.error("File move failed:", result);
    // Log but don't fail the main operation
  }
} catch (error) {
  console.error("File operation error:", error);
  // Continue with business logic
}
```

## Monitoring and Maintenance

### Regular Bin Monitoring

```javascript
// Check bin size periodically
const stats = await FileManager.listBinFiles();
if (stats.total > 1000) {
  console.warn(`Bin has ${stats.total} files - consider cleanup`);
}
```

### Automated Cleanup

Consider setting up a scheduled task to automatically clean up old files:

```javascript
// Example: Weekly cleanup of files older than 30 days
const cron = require("node-cron");

cron.schedule("0 2 * * 0", async () => {
  // Every Sunday at 2 AM
  try {
    const result = await FileManager.cleanupOldBinFiles(30);
    console.log(`Weekly cleanup: deleted ${result.deleted.length} files`);
  } catch (error) {
    console.error("Cleanup error:", error);
  }
});
```

## Security Considerations

1. **Admin Only**: All bin management operations require admin privileges
2. **Path Safety**: File paths are validated to prevent directory traversal
3. **Audit Trail**: All operations are logged via the LogService
4. **File Verification**: Files are checked for existence before operations

## Storage Management

- **Disk Space**: Monitor bin directory size regularly
- **Retention Policy**: Implement appropriate cleanup schedules
- **Backup**: Consider backing up bin contents for critical files
- **Access Control**: Restrict filesystem access to bin directory
