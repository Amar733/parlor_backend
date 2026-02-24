const LogService = require('../services/logService');

/**
 * Middleware to automatically log activities
 */
const activityLogger = (options = {}) => {
    const {
        logAllRequests = false,
        logAuth = true,
        logCrud = true,
        logFiles = true,
        excludePaths = ['/health', '/api', '/uploads'],
        excludeMethods = ['OPTIONS']
    } = options;

    return async (req, res, next) => {
        // Skip logging for excluded paths and methods
        if (excludePaths.some(path => req.path.startsWith(path)) ||
            excludeMethods.includes(req.method)) {
            return next();
        }

        // Store original res.json to intercept responses
        const originalJson = res.json;
        const originalSend = res.send;

        // Track response data
        let responseData = null;
        let isResponseSent = false;

        // Override res.json to capture response
        res.json = function (data) {
            if (!isResponseSent) {
                responseData = data;
                isResponseSent = true;
                logActivity(req, res, responseData);
            }
            return originalJson.call(this, data);
        };

        // Override res.send to capture response
        res.send = function (data) {
            if (!isResponseSent) {
                responseData = data;
                isResponseSent = true;
                logActivity(req, res, responseData);
            }
            return originalSend.call(this, data);
        };

        // Function to log activity based on request/response
        const logActivity = async (req, res, responseData) => {
            try {
                const { method, path } = req;
                const statusCode = res.statusCode;

                // Only log successful operations (2xx status codes) for CRUD
                if (statusCode >= 400 && !logAllRequests) {
                    return;
                }

                // Determine entity type from path
                const pathSegments = path.split('/').filter(segment => segment);
                const entityType = pathSegments[1]; // Usually /api/entityType/...

                // Log authentication activities
                if (logAuth && path.includes('/auth/')) {
                    const action = pathSegments[2]; // login, register, etc.
                    if (action && req.user) {
                        await LogService.logAuth(req.user, action, req, {
                            statusCode,
                            success: statusCode < 400
                        });
                    }
                    return;
                }

                // Log file operations
                if (logFiles && (path.includes('/upload') || req.file || req.files)) {
                    const action = method === 'POST' ? 'upload' : method === 'GET' ? 'download' : 'access';
                    const fileInfo = req.file || req.files?.[0] || { filename: 'unknown' };

                    if (req.user) {
                        await LogService.logFile(req.user, action, fileInfo, req, {
                            statusCode,
                            path
                        });
                    }
                    return;
                }

                // Log CRUD operations
                if (logCrud && req.user && entityType && statusCode < 400) {
                    let operation;
                    let entityId = pathSegments[2]; // Usually /api/entityType/id

                    switch (method) {
                        case 'GET':
                            operation = entityId ? 'read' : 'list';
                            break;
                        case 'POST':
                            operation = 'create';
                            // For POST, get entity ID from response if available
                            if (responseData && typeof responseData === 'object') {
                                entityId = responseData._id || responseData.id || 'new';
                            }
                            break;
                        case 'PUT':
                        case 'PATCH':
                            operation = 'update';
                            break;
                        case 'DELETE':
                            operation = 'delete';
                            break;
                        default:
                            operation = method.toLowerCase();
                    }

                    // Only log if we have a valid entity type
                    const validEntityTypes = [
                        'patients', 'appointments', 'services', 'portfolio',
                        'testimonials', 'blood-reports', 'prescriptions',
                        'users', 'coupons', 'permissions', 'summaries'
                    ];

                    if (validEntityTypes.includes(entityType)) {
                        await LogService.logCrud(
                            req.user,
                            operation,
                            entityType.replace('-', ''), // Remove hyphens for consistency
                            entityId || 'unknown',
                            req,
                            {
                                statusCode,
                                method,
                                path,
                                success: statusCode < 400
                            }
                        );
                    }
                }

                // Log all requests if enabled
                if (logAllRequests) {
                    await LogService.logActivity({
                        actor: req.user || null,
                        action: `request.${method.toLowerCase()}`,
                        entity: {
                            type: 'endpoint',
                            id: path,
                            name: `${method} ${path}`
                        },
                        details: {
                            statusCode,
                            method,
                            path,
                            success: statusCode < 400,
                            responseTime: Date.now() - req.startTime
                        },
                        request: req
                    });
                }
            } catch (error) {
                console.error('Activity logging error:', error);
                // Don't break the request flow
            }
        };

        // Add start time for response time calculation
        req.startTime = Date.now();

        next();
    };
};

/**
 * Middleware to manually log specific activities
 */
const logActivity = (action, entityType, getEntityInfo) => {
    return async (req, res, next) => {
        try {
            // Store original res.json to log after successful response
            const originalJson = res.json;

            res.json = function (data) {
                // Only log on successful responses
                if (res.statusCode < 400 && req.user) {
                    const entityInfo = typeof getEntityInfo === 'function'
                        ? getEntityInfo(req, res, data)
                        : { id: 'unknown', name: undefined };

                    LogService.logActivity({
                        actor: req.user,
                        action,
                        entity: {
                            type: entityType,
                            id: entityInfo.id?.toString() || 'unknown',
                            name: entityInfo.name
                        },
                        details: {
                            statusCode: res.statusCode,
                            method: req.method,
                            path: req.path
                        },
                        request: req
                    }).catch(error => {
                        console.error('Manual activity logging error:', error);
                    });
                }

                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            console.error('Log activity middleware error:', error);
            next(error);
        }
    };
};

module.exports = {
    activityLogger,
    logActivity
};









