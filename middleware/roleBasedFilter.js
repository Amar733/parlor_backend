const Appointment = require('../models/Appointment');

/**
 * Middleware to filter data based on user role
 * - Doctors only see their own patients, appointments, etc.
 * - Admins see everything
 */
const roleBasedFilter = () => {
    return async (req, res, next) => {
        // Skip if no user (public routes)
        if (!req.user) {
            return next();
        }

        // Admin users see everything - no filtering needed
        if (req.user.role === 'admin') {
            return next();
        }

        // Doctor role filtering
        if (req.user.role === 'doctor') {
            // Get doctor's patient IDs from appointments
            try {
                const doctorPatientIds = await Appointment.find({ 
                    doctorId: req.user._id 
                }).distinct('patientId');

                // Add filtering context to request
                req.roleFilter = {
                    role: 'doctor',
                    doctorId: req.user._id,
                    patientIds: doctorPatientIds
                };

                // Override the query methods to add filters
                addQueryFilters(req);

            } catch (error) {
                console.error('Error setting up role-based filtering:', error);
                return next(error);
            }
        }

        next();
    };
};

/**
 * Add query filters based on user role
 */
const addQueryFilters = (req) => {
    // Store original query for reference
    req.originalQuery = { ...req.query };

    // Add filters based on the route being accessed
    const path = req.path;
    const method = req.method;

    // For doctors, modify queries based on the endpoint
    if (req.roleFilter && req.roleFilter.role === 'doctor') {
        
        // Appointments: filter by doctorId
        if (path.includes('/appointments')) {
            if (method === 'GET') {
                // Add doctorId filter to query
                req.query.doctorId = req.roleFilter.doctorId;
            }
        }

        // Patients: filter by patient IDs from doctor's appointments
        else if (path.includes('/patients')) {
            if (method === 'GET' && req.roleFilter.patientIds.length > 0) {
                // This will be handled in the controller using req.roleFilter.patientIds
                req.query._filterByPatientIds = req.roleFilter.patientIds.join(',');
            }
        }

        // Blood Reports: filter by patient IDs
        else if (path.includes('/blood-reports')) {
            if (method === 'GET' && req.roleFilter.patientIds.length > 0) {
                req.query._filterByPatientIds = req.roleFilter.patientIds.join(',');
            }
        }

        // Prescriptions: filter by patient IDs
        else if (path.includes('/prescriptions')) {
            if (method === 'GET' && req.roleFilter.patientIds.length > 0) {
                req.query._filterByPatientIds = req.roleFilter.patientIds.join(',');
            }
        }

        // Time slots: filter by doctorId
        else if (path.includes('/timeslots')) {
            if (method === 'GET') {
                req.query.doctorId = req.roleFilter.doctorId;
            }
        }
    }
};

/**
 * Helper function to build MongoDB query with role-based filters
 */
const buildRoleBasedQuery = (req, baseQuery = {}) => {
    if (!req.roleFilter || req.roleFilter.role === 'admin') {
        return baseQuery;
    }

    if (req.roleFilter.role === 'doctor') {
        const path = req.path;

        // Appointments: filter by doctorId
        if (path.includes('/appointments')) {
            baseQuery.doctorId = req.roleFilter.doctorId;
        }

        // Patients, Blood Reports, Prescriptions: filter by patientIds
        else if (path.includes('/patients') || 
                 path.includes('/blood-reports') || 
                 path.includes('/prescriptions')) {
            if (req.roleFilter.patientIds.length > 0) {
                baseQuery.patientId = { $in: req.roleFilter.patientIds };
            } else {
                // No patients assigned to this doctor yet
                baseQuery.patientId = { $in: [] }; // Return empty results
            }
        }

        // Time slots: filter by userId (doctorId)
        else if (path.includes('/timeslots')) {
            baseQuery.userId = req.roleFilter.doctorId;
        }
    }

    return baseQuery;
};

/**
 * Helper function to check if user can access specific resource
 */
const canAccessResource = (req, resourceId, resourceType) => {
    if (!req.roleFilter || req.roleFilter.role === 'admin') {
        return true;
    }

    if (req.roleFilter.role === 'doctor') {
        switch (resourceType) {
            case 'appointment':
                // Doctor can access if they are the assigned doctor
                return true; // Will be validated in the query
            
            case 'patient':
                // Doctor can access if patient is in their appointment list
                return req.roleFilter.patientIds.includes(resourceId);
            
            case 'doctor':
                // Doctor can only access their own profile
                return resourceId === req.roleFilter.doctorId.toString();
            
            default:
                return true; // Will be filtered by query
        }
    }

    return false;
};

module.exports = {
    roleBasedFilter,
    buildRoleBasedQuery,
    canAccessResource
};
