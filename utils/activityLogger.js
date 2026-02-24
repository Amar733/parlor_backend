const ActivityLog = require('../models/ActivityLog');

/**
 * Log user activity
 * @param {Object} actorInfo - Information about the user performing the action
 * @param {string} action - The action being performed
 * @param {Object} entityInfo - Information about the entity being acted upon
 * @param {Object} details - Additional details about the action
 * @param {Object} requestInfo - Request information (IP, user agent)
 */
const logActivity = async (actorInfo, action, entityInfo, details = {}, requestInfo = {}) => {
    try {
        const activityLog = new ActivityLog({
            actor: actorInfo,
            action,
            entity: entityInfo,
            details,
            request: requestInfo
        });

        await activityLog.save();
        return activityLog;
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error to prevent breaking the main operation
        return null;
    }
};

/**
 * Middleware to automatically log activities
 */
const activityLogger = (action, entityType) => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json;

        res.json = function (data) {
            // Log activity after successful operation
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const actorInfo = {
                    id: req.user?._id?.toString() || 'anonymous',
                    name: req.user?.name || 'Anonymous User'
                };

                const entityInfo = {
                    type: entityType,
                    id: req.params.id || data._id || 'unknown',
                    name: data.name || data.title || data.firstName || 'Unknown'
                };

                const requestInfo = {
                    ip: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('User-Agent')
                };

                logActivity(actorInfo, action, entityInfo, { method: req.method, url: req.originalUrl }, requestInfo);
            }

            // Call original res.json
            return originalJson.call(this, data);
        };

        next();
    };
};

module.exports = {
    logActivity,
    activityLogger
};
