const ManagedUser = require('../models/ManagedUser');
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await ManagedUser.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            permissions: user.permissions,
            specialization: user.specialization,
            bio: user.bio,
            availableSlots: user.availableSlots
        };
        res.json(userData);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const updateData = { ...req.body };
        if (updateData.password === '' || updateData.password === undefined) {
            delete updateData.password;
        }
        const currentUser = await ManagedUser.findById(userId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        Object.assign(currentUser, updateData);
        await currentUser.save();
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
};
