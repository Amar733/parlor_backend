const ActivityLog = require('../models/ActivityLog');

/**
 * Log service for storing activity logs
 */
class LogService {
    /**
     * Helper to get a more reliable IP address from the request
     * @param {Object} req - Express request object
     * @returns {string} IP address
     */
    static getIpFromRequest(req) {
        let ip = req.ip;

        // Check for forwarded IP (common with proxies/load balancers)
        const xff = req.get('x-forwarded-for');
        if (xff) {
            // 'x-forwarded-for' can be a comma-separated list of IPs. The client's IP is the first one.
            ip = xff.split(',')[0].trim();
        }

        // Fallback to connection remote address
        if (!ip) {
            ip = req.connection.remoteAddress || req.socket.remoteAddress;
        }

        // Handle IPv6 localhost
        if (ip === '::1') {
            ip = '127.0.0.1';
        }

        return ip || 'unknown';
    }

    /**
     * Log an activity
     * @param {Object} payload - Log payload
     * @param {Object|null} payload.actor - User who performed the action
     * @param {string} payload.action - Action performed
     * @param {Object} payload.entity - Entity affected
     * @param {string} payload.entity.type - Type of entity
     * @param {string} payload.entity.id - ID of entity
     * @param {string} [payload.entity.name] - Name of entity
     * @param {Object} [payload.details] - Additional details
     * @param {Object} payload.request - Express request object
     * @returns {Promise<void>}
     */
    static async logActivity(payload) {
        try {
            const { actor, action, entity, details, request } = payload;

            // Validate required fields
            if (!action) {
                console.warn('Activity log warning: Missing action');
                return;
            }

            if (!entity || !entity.type || !entity.id) {
                console.warn('Activity log warning: Missing entity information');
                return;
            }

            // Prepare actor information
            const actorInfo = actor
                ? {
                    id: actor._id?.toString() || actor.id?.toString() || 'unknown',
                    name: actor.name || 'Unknown User'
                }
                : {
                    id: 'system',
                    name: 'Anonymous'
                };

            // Prepare log entry
            const logEntry = {
                actor: actorInfo,
                action,
                entity: {
                    type: entity.type,
                    id: entity.id.toString(),
                    name: entity.name || undefined
                },
                details: details || {},
                request: {
                    ip: this.getIpFromRequest(request),
                    userAgent: request.get('user-agent') || undefined,
                },
            };

            // Save to database
            await ActivityLog.create(logEntry);

            // Optional: Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`[ACTIVITY LOG] ${actorInfo.name} performed "${action}" on ${entity.type}:${entity.id}`);
            }
        } catch (error) {
            console.error("Failed to log activity:", error);
            // Do not throw error, logging should not break the main operation.
        }
    }

    /**
     * Log user authentication
     * @param {Object} user - User object
     * @param {string} action - Auth action (login, logout, register, etc.)
     * @param {Object} request - Express request object
     * @param {Object} [details] - Additional details
     */
    static async logAuth(user, action, request, details = {}) {
        await this.logActivity({
            actor: user,
            action: `auth.${action}`,
            entity: {
                type: 'user',
                id: user._id?.toString() || user.id?.toString(),
                name: user.name || user.email
            },
            details: {
                ...details,
                timestamp: new Date().toISOString()
            },
            request
        });
    }

    /**
     * Log CRUD operations
     * @param {Object} user - User performing the action
     * @param {string} operation - CRUD operation (create, read, update, delete)
     * @param {string} entityType - Type of entity
     * @param {string|Object} entity - Entity ID or entity object
     * @param {Object} request - Express request object
     * @param {Object} [details] - Additional details
     */
    static async logCrud(user, operation, entityType, entity, request, details = {}) {
        const entityId = typeof entity === 'object' ? entity._id?.toString() || entity.id?.toString() : entity.toString();
        const entityName = typeof entity === 'object' ? entity.name || entity.title || entity.firstName : undefined;

        await this.logActivity({
            actor: user,
            action: `${entityType}.${operation}`,
            entity: {
                type: entityType,
                id: entityId,
                name: entityName
            },
            details: {
                ...details,
                operation,
                timestamp: new Date().toISOString()
            },
            request
        });
    }

    /**
     * Log file operations
     * @param {Object} user - User performing the action
     * @param {string} action - File action (upload, download, delete)
     * @param {Object} fileInfo - File information
     * @param {Object} request - Express request object
     * @param {Object} [details] - Additional details
     */
    static async logFile(user, action, fileInfo, request, details = {}) {
        await this.logActivity({
            actor: user,
            action: `file.${action}`,
            entity: {
                type: 'file',
                id: fileInfo.filename || fileInfo.id || 'unknown',
                name: fileInfo.originalname || fileInfo.filename
            },
            details: {
                ...details,
                fileSize: fileInfo.size,
                mimeType: fileInfo.mimetype,
                timestamp: new Date().toISOString()
            },
            request
        });
    }

    /**
     * Log system events
     * @param {string} action - System action
     * @param {Object} [details] - Additional details
     * @param {Object} [request] - Express request object (optional for system events)
     */
    static async logSystem(action, details = {}, request = null) {
        await this.logActivity({
            actor: null,
            action: `system.${action}`,
            entity: {
                type: 'system',
                id: 'system',
                name: 'System'
            },
            details: {
                ...details,
                timestamp: new Date().toISOString()
            },
            request: request || { ip: 'system', userAgent: 'system' }
        });
    }

    /**
     * Get activity logs with pagination and filtering
     * @param {Object} filters - Filter options
     * @param {number} [page=1] - Page number
     * @param {number} [limit=20] - Items per page
     * @returns {Promise<Object>} Paginated activity logs
     */
    static async getActivityLogs(filters = {}, page = 1, limit = 20) {
        try {
            const query = {};

            // Apply filters
            if (filters.action) {
                query.action = { $regex: filters.action, $options: 'i' };
            }

            if (filters.entityType) {
                query['entity.type'] = filters.entityType;
            }

            if (filters.actorId) {
                query['actor.id'] = filters.actorId;
            }

            if (filters.startDate || filters.endDate) {
                query.createdAt = {};
                if (filters.startDate) {
                    query.createdAt.$gte = new Date(filters.startDate);
                }
                if (filters.endDate) {
                    query.createdAt.$lte = new Date(filters.endDate);
                }
            }

            const total = await ActivityLog.countDocuments(query);
            const logs = await ActivityLog.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            return {
                logs,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit
                }
            };
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            throw error;
        }
    }
}

module.exports = LogService;
