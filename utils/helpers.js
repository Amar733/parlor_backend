/**
 * Standard API response format
 */
const successResponse = (data, message = 'Success', statusCode = 200) => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

const errorResponse = (message = 'Internal Server Error', statusCode = 500, errors = null) => {
    return {
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString()
    };
};

/**
 * Pagination helper
 */
const getPaginationData = (page, limit, total) => {
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const totalPages = Math.ceil(total / itemsPerPage);

    return {
        currentPage,
        totalPages,
        total,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
    };
};

/**
 * Generate random string for codes/tokens
 */
const generateRandomString = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date = new Date()) => {
    return date.toISOString().split('T')[0];
};

/**
 * Check if date is expired
 */
const isDateExpired = (dateString) => {
    const today = new Date();
    const expiry = new Date(dateString);
    return expiry < today;
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000); // Limit length
};

/**
 * Calculate discount amount
 */
const calculateDiscount = (originalAmount, discount, discountType) => {
    if (discountType === 'percentage') {
        return (originalAmount * discount) / 100;
    } else if (discountType === 'fixed') {
        return Math.min(discount, originalAmount);
    }
    return 0;
};

/**
 * Generate file URL from filename
 */
const generateFileUrl = (filename, baseUrl = '') => {
    return `${baseUrl}/uploads/${filename}`;
};

/**
 * Extract file extension
 */
const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Check if file type is allowed
 */
const isAllowedFileType = (filename, allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']) => {
    const extension = getFileExtension(filename).toLowerCase();
    return allowedTypes.includes(extension);
};

module.exports = {
    successResponse,
    errorResponse,
    getPaginationData,
    generateRandomString,
    formatDate,
    isDateExpired,
    sanitizeInput,
    calculateDiscount,
    generateFileUrl,
    getFileExtension,
    isAllowedFileType
};
