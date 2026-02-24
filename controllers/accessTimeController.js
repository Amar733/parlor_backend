const AccessTime = require('../models/AccessTime');
const moment = require('moment-timezone');

/**
 * Validate access based on time configuration
 * @param {String} key - Configuration key
 * @param {ObjectId} userId - User ID to check for override access
 * @returns {Object} - Access validation result
 */
async function validateAccess(key, userId) {
    const config = await AccessTime.findOne({ key, isEnabled: true });

    if (!config) {
        return { isAccessible: true, reason: 'NO_RESTRICTION' };
    }

    // Check override users
    if (userId && config.overrideUsers.some(id => id.toString() === userId.toString())) {
        return { isAccessible: true, reason: 'OVERRIDE_USER' };
    }

    const now = moment().tz(config.timezone);
    const currentDay = now.day();
    const currentDate = now.format('YYYY-MM-DD');
    const currentTime = now.format('HH:mm');

    // Check if today is allowed
    if (!config.daysOfWeek.includes(currentDay)) {
        return {
            isAccessible: false,
            reason: 'DAY_NOT_ALLOWED',
            message: 'Access not allowed on this day'
        };
    }

    // Check holidays
    const holiday = config.holidays.find(h => h.date === currentDate);
    if (holiday) {
        return {
            isAccessible: false,
            reason: 'HOLIDAY',
            message: config.messages.onHoliday.replace('{reason}', holiday.reason)
        };
    }

    // Check break times
    for (const breakTime of config.breakTimes) {
        if (currentTime >= breakTime.startTime && currentTime < breakTime.endTime) {
            return {
                isAccessible: false,
                reason: 'ON_BREAK',
                message: config.messages.onBreak.replace('{endTime}', breakTime.endTime),
                nextOpenTime: moment.tz(`${currentDate} ${breakTime.endTime}`, config.timezone).toISOString()
            };
        }
    }

    // Apply grace period
    const openTimeWithGrace = moment.tz(
        `${currentDate} ${config.openTime}`,
        config.timezone
    ).subtract(config.gracePeriodMinutes, 'minutes');

    const closeTime = moment.tz(
        `${currentDate} ${config.closeTime}`,
        config.timezone
    );

    // Check if before opening
    if (now.isBefore(openTimeWithGrace)) {
        return {
            isAccessible: false,
            reason: 'BEFORE_OPEN',
            message: config.messages.beforeOpen.replace('{openTime}', config.openTime),
            nextOpenTime: openTimeWithGrace.toISOString()
        };
    }

    // Check if after closing
    if (now.isAfter(closeTime)) {
        return {
            isAccessible: false,
            reason: 'AFTER_CLOSE',
            message: config.messages.afterClose
                .replace('{openTime}', config.openTime)
                .replace('{closeTime}', config.closeTime)
        };
    }

    return { isAccessible: true, reason: 'WITHIN_HOURS' };
}

/**
 * Get access time configuration
 * @route GET /api/settings/access-time
 * @query {String} key - Configuration key (default: "pos_access_time")
 */
exports.getAccessTime = async (req, res) => {
    try {
        const key = req.query.key || 'pos_access_time';
        const userId = req.user ? req.user.id : null;

        const config = await AccessTime.findOne({ key });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Access time configuration not found'
            });
        }

        // Validate current access
        const accessValidation = await validateAccess(key, userId);

        res.json({
            success: true,
            data: {
                key: config.key,
                pageName: config.pageName,
                openTime: config.openTime,
                closeTime: config.closeTime,
                timezone: config.timezone,
                isEnabled: config.isEnabled,
                allowWeekends: config.allowWeekends,
                daysOfWeek: config.daysOfWeek,
                breakTimes: config.breakTimes,
                holidays: config.holidays,
                gracePeriodMinutes: config.gracePeriodMinutes,
                messages: config.messages,
                serverTime: new Date().toISOString(),
                isAccessible: accessValidation.isAccessible,
                reason: accessValidation.reason,
                message: accessValidation.message,
                nextOpenTime: accessValidation.nextOpenTime
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create or Update access time configuration (Upsert)
 * @route POST /api/settings/access-time
 * @access Admin only
 */
exports.updateAccessTime = async (req, res) => {
    try {
        const {
            key,
            pageName,
            openTime,
            closeTime,
            timezone,
            isEnabled,
            allowWeekends,
            daysOfWeek,
            breakTimes,
            holidays,
            gracePeriodMinutes,
            overrideUsers,
            messages
        } = req.body;

        // Check if key is provided
        if (!key) {
            return res.status(400).json({
                success: false,
                message: 'Key is required'
            });
        }

        // Check if configuration already exists
        const existingConfig = await AccessTime.findOne({ key });

        if (existingConfig) {
            // Update existing configuration
            const updateData = {};
            if (pageName !== undefined) updateData.pageName = pageName;
            if (openTime !== undefined) updateData.openTime = openTime;
            if (closeTime !== undefined) updateData.closeTime = closeTime;
            if (timezone !== undefined) updateData.timezone = timezone;
            if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
            if (allowWeekends !== undefined) updateData.allowWeekends = allowWeekends;
            if (daysOfWeek !== undefined) updateData.daysOfWeek = daysOfWeek;
            if (breakTimes !== undefined) updateData.breakTimes = breakTimes;
            if (holidays !== undefined) updateData.holidays = holidays;
            if (gracePeriodMinutes !== undefined) updateData.gracePeriodMinutes = gracePeriodMinutes;
            if (overrideUsers !== undefined) updateData.overrideUsers = overrideUsers;
            if (messages !== undefined) updateData.messages = messages;

            const config = await AccessTime.findOneAndUpdate(
                { key },
                updateData,
                { new: true, runValidators: true }
            );

            return res.json({
                success: true,
                message: 'Access time configuration updated successfully',
                data: {
                    _id: config._id,
                    key: config.key,
                    pageName: config.pageName,
                    openTime: config.openTime,
                    closeTime: config.closeTime,
                    timezone: config.timezone,
                    isEnabled: config.isEnabled,
                    allowWeekends: config.allowWeekends,
                    daysOfWeek: config.daysOfWeek,
                    breakTimes: config.breakTimes,
                    holidays: config.holidays,
                    gracePeriodMinutes: config.gracePeriodMinutes,
                    overrideUsers: config.overrideUsers,
                    messages: config.messages,
                    updatedAt: config.updatedAt
                }
            });
        }

        // Create new configuration
        const newConfig = {
            key,
            pageName: pageName || 'Protected Page',
            openTime: openTime || '09:00',
            closeTime: closeTime || '21:00',
            timezone: timezone || 'Asia/Kolkata',
            isEnabled: isEnabled !== undefined ? isEnabled : true,
            allowWeekends: allowWeekends !== undefined ? allowWeekends : true,
            daysOfWeek: daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
            breakTimes: breakTimes || [],
            holidays: holidays || [],
            gracePeriodMinutes: gracePeriodMinutes || 0,
            overrideUsers: overrideUsers || [],
            messages: messages || {},
            createdBy: req.user ? req.user.id : null
        };

        const config = await AccessTime.create(newConfig);

        res.status(201).json({
            success: true,
            message: 'Access time configuration created successfully',
            data: {
                _id: config._id,
                key: config.key,
                pageName: config.pageName,
                openTime: config.openTime,
                closeTime: config.closeTime,
                timezone: config.timezone,
                isEnabled: config.isEnabled,
                allowWeekends: config.allowWeekends,
                daysOfWeek: config.daysOfWeek,
                breakTimes: config.breakTimes,
                holidays: config.holidays,
                gracePeriodMinutes: config.gracePeriodMinutes,
                overrideUsers: config.overrideUsers,
                messages: config.messages
            }
        });
    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A configuration with this key already exists'
            });
        }

        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * Check user access (for override users)
 * @route GET /api/settings/access-time/check
 * @query {String} key - Configuration key (required)
 * @access Private (requires authentication)
 */
exports.checkUserAccess = async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) {
            return res.status(400).json({
                success: false,
                message: 'Key parameter is required'
            });
        }

        const userId = req.user ? req.user.id : null;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const accessValidation = await validateAccess(key, userId);

        res.json({
            success: true,
            data: {
                hasAccess: accessValidation.isAccessible,
                reason: accessValidation.reason,
                message: accessValidation.message || (accessValidation.isAccessible
                    ? 'You have access to this page'
                    : 'Access denied'),
                nextOpenTime: accessValidation.nextOpenTime
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAccessTime: exports.getAccessTime,
    updateAccessTime: exports.updateAccessTime,
    checkUserAccess: exports.checkUserAccess,
    validateAccess
};
