const jwt = require('jsonwebtoken');
const ManagedUser = require('../models/ManagedUser');

// Enhanced auth middleware with public route handling
const authMiddleware = (options = {}) => {
    const {
        publicRoutes = [],
        publicGetRoutes = [],
        publicPostRoutes = [],
        optional = false
    } = options;

    return async (req, res, next) => {
        try {
            const { method, path } = req;

            // Check if route is public
            const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
            const isPublicGetRoute = method === 'GET' && publicGetRoutes.some(route => path.startsWith(route));
            const isPublicPostRoute = method === 'POST' && publicPostRoutes.some(route => path.startsWith(route));

            if (isPublicRoute || isPublicGetRoute || isPublicPostRoute) {
                return next();
            }

            // Get token from header
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1];

            if (!token) {
                if (optional) {
                    return next();
                }
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required: No token provided'
                });
            }

            try {
                // Verify token
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Get user from database
                const user = await ManagedUser.findById(decoded.userId).select('-password');

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication failed: User not found'
                    });
                }

                // Add user to request object
                req.user = user;
                next();
            } catch (jwtError) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed: Invalid token'
                });
            }
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Insufficient permissions'
            });
        }

        next();
    };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = authMiddleware({ optional: true });

// Public routes configuration
const publicRouteConfig = {
    publicRoutes: [
        '/api/auth/login',
        '/api/auth/register',
        '/api/upload'
    ],
    publicGetRoutes: [
        '/api/appointments',
        '/api/services',
        '/api/portfolio',
        '/api/testimonials',
        '/api/public'
    ],
    publicPostRoutes: [
        '/api/appointments'
    ]
};

// Main auth middleware with public routes
const auth = authMiddleware(publicRouteConfig);

module.exports = {
    auth,
    authorize,
    optionalAuth,
    authMiddleware,
    publicRouteConfig
};
