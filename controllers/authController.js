const jwt = require('jsonwebtoken');
const ManagedUser = require('../models/ManagedUser');
const LogService = require('../services/logService');

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, specialization, bio } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        const existingUser = await ManagedUser.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const user = new ManagedUser({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'staff',
            specialization,
            bio,
            permissions: [],
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`
        });
        const createdUser = await user.save();
        const token = generateToken(createdUser._id);
        const userData = {
            id: createdUser._id.toString(),
            name: createdUser.name,
            email: createdUser.email,
            role: createdUser.role,
            avatarUrl: createdUser.avatarUrl,
            permissions: createdUser.permissions
        };
        await LogService.logActivity({
            actor: createdUser,
            action: 'USER_REGISTER',
            entity: { type: 'User', id: createdUser._id.toString(), name: createdUser.name },
            request: req
        });
        res.status(201).json({ success: true, message: 'User registered successfully', token, user: userData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'An internal server error occurred' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt with email:", email, "AKASH");
        // Print all users for debugging
        // const allUsers = await ManagedUser.find();
        // console.log("All users in DB:", allUsers);

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const foundUser = await ManagedUser.findOne({ email: email.toLowerCase() });

        console.log("Found user:", foundUser);
        if (!foundUser) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const bcrypt = require('bcryptjs');
        const isPasswordMatch = await bcrypt.compare(password, foundUser.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        const userData = {
            _id: foundUser._id.toString(),
            name: foundUser.name,
            email: foundUser.email,
            role: foundUser.role,
            avatarUrl: foundUser?.avatarUrl || foundUser?.avatar,
            permissions: foundUser.permissions
        };
        const token = generateToken(foundUser._id);
        await LogService.logActivity({
            actor: foundUser,
            action: 'USER_LOGIN',
            entity: { type: 'User', id: foundUser._id.toString(), name: foundUser.name },
            request: req
        });
        res.json({ success: true, token, user: userData, message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'An internal server error occurred' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userData = {
            _id: req.user._id.toString(),
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            avatarUrl: req.user.avatarUrl,
            permissions: req.user.permissions,
            specialization: req.user.specialization,
            bio: req.user.bio,
            availableSlots: req.user.availableSlots
        };
        res.json({ success: true, user: userData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'An internal server error occurred' });
    }
};

exports.logout = async (req, res) => {
    try {
        await LogService.logActivity({
            actor: req.user,
            action: 'USER_LOGOUT',
            entity: { type: 'User', id: req.user._id.toString(), name: req.user.name },
            request: req
        });
        res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'An internal server error occurred' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }
        const user = await ManagedUser.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        // Encrypt password before saving
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        await LogService.logActivity({
            actor: req.user,
            action: 'PASSWORD_CHANGE',
            entity: { type: 'User', id: req.user._id.toString(), name: req.user.name },
            details: { message: 'User changed their password' },
            request: req
        });
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'An internal server error occurred' });
    }
};
// Change password using encrypted password
exports.changePasswordWithEncryptedPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }
    
        const user = await ManagedUser.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Encrypt password before saving
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        await LogService.logActivity({
            actor: user,
            action: 'PASSWORD_CHANGE_EMAIL',
            entity: { type: 'User', id: user._id.toString(), name: user.name },
            details: { message: 'User changed password via encrypted email' },
            request: req
        });
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'An internal server error occurred' });
    }
};
