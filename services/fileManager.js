const fs = require('fs').promises;
const path = require('path');

/**
 * File management utility for handling file operations
 */
class FileManager {
    /**
     * Move a file to the bin directory instead of deleting it permanently
     * @param {string|undefined|null} fileUrl - The file URL to move to bin
     * @returns {Promise<void>}
     */
    static async moveFileToBin(fileUrl) {
        if (!fileUrl || (!fileUrl.startsWith('/uploads/') && !fileUrl.startsWith('uploads/'))) {
            return; // Not a managed file, do nothing
        }

        // Extract filename from URL
        const filename = path.basename(fileUrl);
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const sourcePath = path.join(uploadsDir, filename);
        const binDir = path.join(process.cwd(), '.bin');

        // Add timestamp to avoid conflicts in bin
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const binFilename = `${timestamp}_${filename}`;
        const destinationPath = path.join(binDir, binFilename);

        try {
            // Ensure the .bin directory exists
            await fs.mkdir(binDir, { recursive: true });

            // Check if the source file exists before moving
            await fs.access(sourcePath);

            // Move the file to bin
            await fs.rename(sourcePath, destinationPath);
            console.log(`Moved ${filename} to bin as ${binFilename}`);

            return { success: true, binPath: destinationPath, originalPath: sourcePath };
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Source file doesn't exist, which is fine. Maybe it was already deleted.
                console.warn(`File not found, could not move to bin: ${sourcePath}`);
                return { success: false, reason: 'file_not_found', path: sourcePath };
            } else {
                console.error(`Error moving file to bin: ${fileUrl}`, error);
                return { success: false, reason: 'move_failed', error: error.message };
            }
        }
    }

    /**
     * Move multiple files to bin
     * @param {string[]} fileUrls - Array of file URLs to move to bin
     * @returns {Promise<Object>} Results of the move operations
     */
    static async moveMultipleFilesToBin(fileUrls) {
        if (!Array.isArray(fileUrls)) {
            return { success: false, reason: 'invalid_input' };
        }

        const results = {
            success: [],
            failed: [],
            total: fileUrls.length
        };

        for (const fileUrl of fileUrls) {
            try {
                const result = await this.moveFileToBin(fileUrl);
                if (result && result.success) {
                    results.success.push({ fileUrl, ...result });
                } else {
                    results.failed.push({ fileUrl, ...result });
                }
            } catch (error) {
                results.failed.push({
                    fileUrl,
                    success: false,
                    reason: 'exception',
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Restore a file from bin back to uploads
     * @param {string} binFilename - The filename in the bin directory
     * @param {string} [originalFilename] - Optional original filename to restore to
     * @returns {Promise<Object>} Result of restore operation
     */
    static async restoreFileFromBin(binFilename, originalFilename = null) {
        const binDir = path.join(process.cwd(), '.bin');
        const sourcePath = path.join(binDir, binFilename);

        // Extract original filename if not provided
        if (!originalFilename) {
            // Remove timestamp prefix (format: 2025-01-29T10-30-00-000Z_originalfile.jpg)
            const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_/;
            originalFilename = binFilename.replace(timestampRegex, '');
        }

        const uploadsDir = path.join(process.cwd(), 'uploads');
        const destinationPath = path.join(uploadsDir, originalFilename);

        try {
            // Ensure uploads directory exists
            await fs.mkdir(uploadsDir, { recursive: true });

            // Check if bin file exists
            await fs.access(sourcePath);

            // Check if destination already exists
            try {
                await fs.access(destinationPath);
                // File exists, create a unique name
                const ext = path.extname(originalFilename);
                const basename = path.basename(originalFilename, ext);
                const timestamp = Date.now();
                originalFilename = `${basename}_restored_${timestamp}${ext}`;
                const newDestinationPath = path.join(uploadsDir, originalFilename);

                await fs.rename(sourcePath, newDestinationPath);
                console.log(`Restored ${binFilename} to ${originalFilename} (renamed to avoid conflict)`);

                return {
                    success: true,
                    originalPath: sourcePath,
                    restoredPath: newDestinationPath,
                    restoredFilename: originalFilename,
                    renamed: true
                };
            } catch {
                // Destination doesn't exist, proceed with restore
                await fs.rename(sourcePath, destinationPath);
                console.log(`Restored ${binFilename} to ${originalFilename}`);

                return {
                    success: true,
                    originalPath: sourcePath,
                    restoredPath: destinationPath,
                    restoredFilename: originalFilename,
                    renamed: false
                };
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.warn(`File not found in bin: ${sourcePath}`);
                return { success: false, reason: 'file_not_found', path: sourcePath };
            } else {
                console.error(`Error restoring file from bin: ${binFilename}`, error);
                return { success: false, reason: 'restore_failed', error: error.message };
            }
        }
    }

    /**
     * List files in the bin directory
     * @param {Object} options - Options for listing
     * @param {number} [options.limit] - Limit number of files returned
     * @param {string} [options.sortBy] - Sort by 'name' or 'date'
     * @param {string} [options.order] - 'asc' or 'desc'
     * @returns {Promise<Object>} List of files in bin
     */
    static async listBinFiles(options = {}) {
        const { limit, sortBy = 'date', order = 'desc' } = options;
        const binDir = path.join(process.cwd(), '.bin');

        try {
            // Ensure bin directory exists
            await fs.mkdir(binDir, { recursive: true });

            const files = await fs.readdir(binDir);
            const fileDetails = [];

            for (const filename of files) {
                try {
                    const filePath = path.join(binDir, filename);
                    const stats = await fs.stat(filePath);

                    // Extract original filename
                    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_/;
                    const originalFilename = filename.replace(timestampRegex, '');

                    fileDetails.push({
                        binFilename: filename,
                        originalFilename,
                        size: stats.size,
                        deletedAt: stats.mtime,
                        createdAt: stats.birthtime
                    });
                } catch (error) {
                    console.warn(`Error reading file details for ${filename}:`, error.message);
                }
            }

            // Sort files
            fileDetails.sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'name') {
                    comparison = a.originalFilename.localeCompare(b.originalFilename);
                } else {
                    comparison = new Date(a.deletedAt) - new Date(b.deletedAt);
                }
                return order === 'desc' ? -comparison : comparison;
            });

            // Apply limit
            const limitedFiles = limit ? fileDetails.slice(0, limit) : fileDetails;

            return {
                success: true,
                files: limitedFiles,
                total: fileDetails.length,
                binDirectory: binDir
            };
        } catch (error) {
            console.error('Error listing bin files:', error);
            return { success: false, reason: 'list_failed', error: error.message };
        }
    }

    /**
     * Permanently delete files from bin (cleanup)
     * @param {string[]} binFilenames - Array of bin filenames to permanently delete
     * @returns {Promise<Object>} Results of deletion operations
     */
    static async permanentlyDeleteFromBin(binFilenames) {
        if (!Array.isArray(binFilenames)) {
            return { success: false, reason: 'invalid_input' };
        }

        const binDir = path.join(process.cwd(), '.bin');
        const results = {
            deleted: [],
            failed: [],
            total: binFilenames.length
        };

        for (const filename of binFilenames) {
            try {
                const filePath = path.join(binDir, filename);
                await fs.unlink(filePath);
                results.deleted.push({ filename, path: filePath });
                console.log(`Permanently deleted ${filename} from bin`);
            } catch (error) {
                results.failed.push({
                    filename,
                    reason: error.code === 'ENOENT' ? 'file_not_found' : 'delete_failed',
                    error: error.message
                });
                console.error(`Error permanently deleting ${filename}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Clean up old files from bin (older than specified days)
     * @param {number} daysOld - Delete files older than this many days
     * @returns {Promise<Object>} Results of cleanup operation
     */
    static async cleanupOldBinFiles(daysOld = 30) {
        const binDir = path.join(process.cwd(), '.bin');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        try {
            const files = await fs.readdir(binDir);
            const oldFiles = [];

            for (const filename of files) {
                try {
                    const filePath = path.join(binDir, filename);
                    const stats = await fs.stat(filePath);

                    if (stats.mtime < cutoffDate) {
                        oldFiles.push(filename);
                    }
                } catch (error) {
                    console.warn(`Error checking file ${filename}:`, error.message);
                }
            }

            const result = await this.permanentlyDeleteFromBin(oldFiles);

            return {
                ...result,
                cutoffDate: cutoffDate.toISOString(),
                daysOld
            };
        } catch (error) {
            console.error('Error during bin cleanup:', error);
            return { success: false, reason: 'cleanup_failed', error: error.message };
        }
    }
}

module.exports = FileManager;
