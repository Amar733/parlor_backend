const Permission = require('../models/Permission');

exports.getAllPermissions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { id: { $regex: search, $options: 'i' } },
                { label: { $regex: search, $options: 'i' } }
            ];
        }
        const permissions = await Permission.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        const total = await Permission.countDocuments(query);
        res.json({
            permissions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPermissionById = async (req, res) => {
    try {
        const permission = await Permission.findById(req.params.id);
        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }
        res.json(permission);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPermission = async (req, res) => {
    try {
        const permission = new Permission(req.body);
        await permission.save();
        res.status(201).json(permission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updatePermission = async (req, res) => {
    try {
        const permission = await Permission.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }
        res.json(permission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deletePermission = async (req, res) => {
    try {
        const permission = await Permission.findByIdAndDelete(req.params.id);
        if (!permission) {
            return res.status(404).json({ message: 'Permission not found' });
        }
        res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
