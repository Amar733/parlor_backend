const express = require('express');
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getMe);

// @route   GET /api/auth/debug
// @desc    Debug auth status
// @access  Public
router.get('/debug', (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const authHeader = req.headers.authorization;
    
    res.json({
        hasAuthHeader: !!authHeader,
        authHeader: authHeader ? 'Bearer ***' : null,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set',
        jwtExpire: process.env.JWT_EXPIRE || '7d'
    });
});

// @route   POST /api/auth/logout
// @desc    Logout user (mainly for logging purposes)
// @access  Private
router.post('/logout', auth, authController.logout);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, authController.changePassword);

// @route   POST /api/auth/change-password-with-email
// @desc    Change password using email (password will be encrypted)
// @access  Public
router.post('/change-password-with-email', authController.changePasswordWithEncryptedPassword);

module.exports = router;
