/**
 * Utility function for checking user permissions across controllers
 * This provides a central place for permission logic to avoid duplication
 */

/**
 * Checks if a user has a specific permission or role-based access
 * 
 * @param {Object} user - The user object from request
 * @param {String} permission - The permission string to check
 * @returns {Boolean} - Whether the user has access
 */
const hasPermission = (user, permission) => {
    // If no user is provided, access is denied
    if (!user) return false;
    
    // Admin always has all permissions
    if (user.role === 'admin') return true;
    
    // Doctor role permissions
    if (user.role === 'doctor') {
        // Grant doctors access to their relevant sections
        // Note: Data filtering happens in controllers to show only doctor's own data
        if (permission.startsWith('/dashboard/appointments:') || 
            permission.startsWith('/dashboard/patients:') ||
            permission.startsWith('/dashboard/prescriptions:') ||
            permission.startsWith('/dashboard/blood-reports:') ||
            permission.startsWith('/dashboard/profile:')) {
            return true;
        }
    }
    
    // Check specific permissions for other roles
    return user.permissions && user.permissions.includes(permission);
};

/**
 * Builds a query filter for role-based data access
 * 
 * @param {Object} user - The user object from request
 * @param {Object} baseQuery - The base query object
 * @returns {Object} - The filtered query
 */
const buildRoleBasedQuery = async (user, baseQuery = {}) => {
    if (!user) return baseQuery;
    
    // Admin can see all data
    if (user.role === 'admin') return baseQuery;
    
    // Doctor can only see their own patient data
    if (user.role === 'doctor') {
        const Appointment = require('../models/Appointment');
        const patientIds = await Appointment.find({ doctorId: user._id }).distinct('patientId');
        
        // Add patient filter to query
        if (baseQuery.patientId) {
            // If patientId is already in query, make it more restrictive
            baseQuery.patientId = { $in: patientIds, ...baseQuery.patientId };
        } else {
            baseQuery.patientId = { $in: patientIds };
        }
    }
    
    return baseQuery;
};

module.exports = {
    hasPermission,
    buildRoleBasedQuery
};
