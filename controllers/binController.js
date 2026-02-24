const FileManager = require('../services/fileManager');
const LogService = require('../services/logService');

exports.listBinFiles = async (req, res) => {
    try {
        const { limit, sortBy, order } = req.query;
        const result = await FileManager.listBinFiles({
            limit: limit ? parseInt(limit) : undefined,
            sortBy,
            order
        });
        if (result.success) {
            await LogService.logActivity({
                actor: req.user,
                action: 'bin.list',
                entity: {
                    type: 'system',
                    id: 'bin',
                    name: 'File Bin'
                },
                details: {
                    filesCount: result.total,
                    filters: { limit, sortBy, order }
                },
                request: req
            });
            res.json({
                success: true,
                data: result
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to list bin files',
                error: result.reason
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.restoreFile = async (req, res) => {
    try {
        const { binFilename, originalFilename } = req.body;
        if (!binFilename) {
            return res.status(400).json({
                success: false,
                message: 'Bin filename is required'
            });
        }
        const result = await FileManager.restoreFileFromBin(binFilename, originalFilename);
        if (result.success) {
            await LogService.logActivity({
                actor: req.user,
                action: 'file.restore',
                entity: {
                    type: 'file',
                    id: binFilename,
                    name: result.restoredFilename
                },
                details: {
                    binFilename,
                    restoredFilename: result.restoredFilename,
                    renamed: result.renamed,
                    restoredPath: result.restoredPath
                },
                request: req
            });
            res.json({
                success: true,
                message: `File restored successfully${result.renamed ? ' (renamed to avoid conflict)' : ''}`,
                data: {
                    restoredFilename: result.restoredFilename,
                    restoredUrl: `/uploads/${result.restoredFilename}`,
                    renamed: result.renamed
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to restore file',
                error: result.reason
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.permanentlyDelete = async (req, res) => {
    try {
        const { filenames } = req.body;
        if (!Array.isArray(filenames) || filenames.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Array of filenames is required'
            });
        }
        const result = await FileManager.permanentlyDeleteFromBin(filenames);
        await LogService.logActivity({
            actor: req.user,
            action: 'bin.permanent_delete',
            entity: {
                type: 'system',
                id: 'bin',
                name: 'File Bin'
            },
            details: {
                filesRequested: result.total,
                filesDeleted: result.deleted.length,
                filesFailed: result.failed.length,
                deletedFiles: result.deleted.map(f => f.filename)
            },
            request: req
        });
        res.json({
            success: true,
            message: `Permanently deleted ${result.deleted.length} of ${result.total} files`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.cleanupBin = async (req, res) => {
    try {
        const { daysOld = 30 } = req.body;
        if (daysOld < 1) {
            return res.status(400).json({
                success: false,
                message: 'daysOld must be at least 1'
            });
        }
        const result = await FileManager.cleanupOldBinFiles(daysOld);
        await LogService.logActivity({
            actor: req.user,
            action: 'bin.cleanup',
            entity: {
                type: 'system',
                id: 'bin',
                name: 'File Bin'
            },
            details: {
                daysOld,
                cutoffDate: result.cutoffDate,
                filesDeleted: result.deleted?.length || 0,
                filesFailed: result.failed?.length || 0
            },
            request: req
        });
        res.json({
            success: true,
            message: `Cleanup completed. Deleted ${result.deleted?.length || 0} old files.`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getBinStats = async (req, res) => {
    try {
        const result = await FileManager.listBinFiles();
        if (result.success) {
            const stats = {
                totalFiles: result.total,
                totalSize: result.files.reduce((sum, file) => sum + file.size, 0),
                oldestFile: result.files.length > 0
                    ? result.files.reduce((oldest, file) =>
                        new Date(file.deletedAt) < new Date(oldest.deletedAt) ? file : oldest
                    )
                    : null,
                newestFile: result.files.length > 0
                    ? result.files.reduce((newest, file) =>
                        new Date(file.deletedAt) > new Date(newest.deletedAt) ? file : newest
                    )
                    : null
            };
            res.json({
                success: true,
                data: stats
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to get bin statistics'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
