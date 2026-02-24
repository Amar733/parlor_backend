const Activity = require('../models/Activity');
const LogService = require('../services/logService');
const FileManager = require('../services/fileManager');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

exports.getAllActivities = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = {};
        query.deletedAt = { $exists: false };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        const activities = await Activity.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await Activity.countDocuments(query);
        res.json({
            success: true,
            data: {
                activities,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching activities'
        });
    }
};

exports.getActivityById = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity || activity.deletedAt) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }
        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching activity'
        });
    }
};

exports.createActivity = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/activities:create') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { title, description, videoUrl, thumbnailUrl } = req.body;
        if (!title || !description || !videoUrl || !thumbnailUrl) {
            return res.status(400).json({ success: false, message: 'Missing required fields: title, description, videoUrl, or thumbnailUrl' });
        }
        const activityData = {
            title,
            description,
            videoUrl,
            thumbnailUrl,
            createdBy: req.user._id
        };
        const activity = new Activity(activityData);
        const createdActivity = await activity.save();
        await LogService.logActivity({
            actor: req.user,
            action: 'CREATE_ACTIVITY',
            entity: {
                type: 'Activity',
                id: createdActivity._id.toString(),
                name: createdActivity.title
            },
            details: {
                activity: createdActivity.toObject()
            },
            request: req
        });
        res.status(201).json({
            success: true,
            data: createdActivity,
            message: 'Activity created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating activity' });
    }
};

exports.updateActivity = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/activities:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { id } = req.params;
        const body = req.body;
        const allowedUpdates = {};
        if (body.title) allowedUpdates.title = body.title;
        if (body.description) allowedUpdates.description = body.description;
        if (body.videoUrl) allowedUpdates.videoUrl = body.videoUrl;
        if (body.thumbnailUrl) allowedUpdates.thumbnailUrl = body.thumbnailUrl;
        const updatedActivity = await Activity.findByIdAndUpdate(
            id,
            allowedUpdates,
            { new: true, runValidators: true }
        );
        if (!updatedActivity) {
            return res.status(404).json({ success: false, message: 'Activity not found' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_ACTIVITY',
            entity: {
                type: 'Activity',
                id: updatedActivity._id.toString(),
                name: updatedActivity.title
            },
            details: {
                changes: allowedUpdates
            },
            request: req
        });
        res.json({
            success: true,
            data: updatedActivity,
            message: 'Activity updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating activity' });
    }
};

exports.softDeleteActivity = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/activities:delete') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { id } = req.params;
        const activityToDelete = await Activity.findById(id);
        if (!activityToDelete) {
            return res.status(404).json({ success: false, message: 'Activity not found' });
        }
        if (activityToDelete.videoUrl) {
            await FileManager.moveFileToBin(activityToDelete.videoUrl);
        }
        if (activityToDelete.thumbnailUrl) {
            await FileManager.moveFileToBin(activityToDelete.thumbnailUrl);
        }
        const updatedActivity = await Activity.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );
        if (!updatedActivity) {
            return res.status(500).json({ success: false, message: 'Failed to delete activity' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'SOFT_DELETE_ACTIVITY',
            entity: {
                type: 'Activity',
                id: id,
                name: activityToDelete.title
            },
            details: {
                deletedActivity: updatedActivity.toObject(),
                movedFiles: {
                    videoUrl: activityToDelete.videoUrl,
                    thumbnailUrl: activityToDelete.thumbnailUrl
                }
            },
            request: req
        });
        res.json({
            success: true,
            data: updatedActivity,
            message: 'Activity deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting activity' });
    }
};

exports.restoreActivity = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/activities:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { id } = req.params;
        const activityToRestore = await Activity.findById(id);
        if (!activityToRestore) {
            return res.status(404).json({ success: false, message: 'Activity not found' });
        }
        if (activityToRestore.videoUrl) {
            await FileManager.restoreFileFromBin(activityToRestore.videoUrl);
        }
        if (activityToRestore.thumbnailUrl) {
            await FileManager.restoreFileFromBin(activityToRestore.thumbnailUrl);
        }
        const restoredActivity = await Activity.findByIdAndUpdate(
            id,
            { $unset: { deletedAt: 1 } },
            { new: true }
        );
        if (!restoredActivity) {
            return res.status(500).json({ success: false, message: 'Failed to restore activity' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'RESTORE_ACTIVITY',
            entity: {
                type: 'Activity',
                id: id,
                name: restoredActivity.title
            },
            details: {
                restoredActivity: restoredActivity.toObject(),
                restoredFiles: {
                    videoUrl: restoredActivity.videoUrl,
                    thumbnailUrl: restoredActivity.thumbnailUrl
                }
            },
            request: req
        });
        res.json({
            success: true,
            data: restoredActivity,
            message: 'Activity restored successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error restoring activity' });
    }
};

exports.permanentDeleteActivity = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized: Admins only' });
        }
        const { id } = req.params;
        const activityToDelete = await Activity.findById(id);
        if (!activityToDelete) {
            return res.status(404).json({ success: false, message: 'Activity not found' });
        }
        if (activityToDelete.videoUrl) {
            await FileManager.permanentlyDeleteFile(activityToDelete.videoUrl);
        }
        if (activityToDelete.thumbnailUrl) {
            await FileManager.permanentlyDeleteFile(activityToDelete.thumbnailUrl);
        }
        const deletedActivity = await Activity.findByIdAndDelete(id);
        if (!deletedActivity) {
            return res.status(404).json({ success: false, message: 'Activity not found during deletion' });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'PERMANENT_DELETE_ACTIVITY',
            entity: {
                type: 'Activity',
                id: id,
                name: activityToDelete.title
            },
            details: {
                deletedActivity: activityToDelete.toObject(),
                deletedFiles: {
                    videoUrl: activityToDelete.videoUrl,
                    thumbnailUrl: activityToDelete.thumbnailUrl
                }
            },
            request: req
        });
        res.status(204).json({ success: true, message: 'Activity permanently deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error permanently deleting activity' });
    }
};
