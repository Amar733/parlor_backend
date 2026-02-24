const ActivityLog = require('../models/ActivityLog');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

exports.getAllActivityLogs = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const { page = 1, limit = 50, action, entityType, actor } = req.query;
        const query = {};
        if (action) query.action = action;
        if (entityType) query['entity.type'] = entityType;
        if (actor) query['actor.id'] = actor;
        const activityLogs = await ActivityLog.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await ActivityLog.countDocuments(query);
        activityLogs.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        res.json(activityLogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity logs' });
    }
};

exports.getActivityLogById = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const activityLog = await ActivityLog.findById(req.params.id);
        if (!activityLog) {
            return res.status(404).json({ message: 'Activity log not found' });
        }
        res.json(activityLog);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity log' });
    }
};

exports.createActivityLog = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const activityLogData = {
            ...req.body,
            actor: {
                id: req.user._id,
                name: req.user.name,
                role: req.user.role
            },
            request: {
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            }
        };
        const activityLog = new ActivityLog(activityLogData);
        await activityLog.save();
        res.status(201).json(activityLog);
    } catch (error) {
        res.status(400).json({ message: 'Error creating activity log' });
    }
};

exports.deleteActivityLog = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const activityLog = await ActivityLog.findByIdAndDelete(req.params.id);
        if (!activityLog) {
            return res.status(404).json({ message: 'Activity log not found' });
        }
        res.json({ message: 'Activity log deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting activity log' });
    }
};

exports.getActivityLogsByUserId = async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const { page = 1, limit = 20 } = req.query;
        const query = { 'actor.id': req.params.userId };
        const activityLogs = await ActivityLog.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await ActivityLog.countDocuments(query);
        res.json(activityLogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user activity logs' });
    }
};

exports.getActivityLogsByEntity = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const { entityType, entityId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const query = {
            'entity.type': entityType,
            'entity.id': entityId
        };
        const logs = await ActivityLog.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await ActivityLog.countDocuments(query);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching entity activity logs' });
    }
};

exports.getActivityLogStats = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        const pipeline = [
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ];
        const actionStats = await ActivityLog.aggregate(pipeline);
        const entityPipeline = [
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$entity.type',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ];
        const entityStats = await ActivityLog.aggregate(entityPipeline);
        const totalLogs = await ActivityLog.countDocuments({
            createdAt: { $gte: startDate }
        });
        res.json({
            totalLogs,
            actionStats,
            entityStats,
            period: `${days} days`
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity log statistics' });
    }
};
