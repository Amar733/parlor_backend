const Chamber = require('../models/chamber');

// function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

// Create Chamber
exports.createChamber = async (req, res) => {
    try {
        // if (!req.user || !hasPermission(req.user, 'manage_chambers')) {
        //     return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
        // }

        const { doctorId, chamberName, city, contactPerson, contactNumber } = req.body;

        const chamber = await Chamber.create({
            doctorId,
            chamberName,
            city,
            contactPerson,
            contactNumber
        });

        return res.status(201).json({
            message: "Chamber created successfully",
            data: chamber
        });

    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// Get All Chambers
exports.getChambers = async (req, res) => {
    try {
        const chambers = await Chamber.find().populate("doctorId", "name email");

        return res.status(200).json({
            message: "Chambers fetched successfully",
            data: chambers
        });

    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// Get Single Chamber by ID
exports.getChamberById = async (req, res) => {
    try {
        const chamber = await Chamber.findById(req.params.id);

        if (!chamber) {
            return res.status(404).json({ message: "Chamber not found" });
        }

        return res.status(200).json({
            message: "Chamber fetched successfully",
            data: chamber
        });

    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// Get Chambers by Doctor ID
exports.getChamberByDoctorId = async (req, res) => {
    try {
        const chambers = await Chamber.find({ doctorId: req.params.doctorId });

        return res.status(200).json({
            message: "Chambers fetched successfully",
            data: chambers
        });

    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// Update Chamber
exports.updateChamber = async (req, res) => {
    try {
        // if (!req.user || !hasPermission(req.user, 'manage_chambers')) {
        //     return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
        // }

        const chamber = await Chamber.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!chamber) {
            return res.status(404).json({ message: "Chamber not found" });
        }

        return res.status(200).json({
            message: "Chamber updated successfully",
            data: chamber
        });

    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// Delete Chamber
exports.deleteChamber = async (req, res) => {
    try {
        // if (!req.user || !hasPermission(req.user, 'manage_chambers')) {
        //     return res.status(403).json({ message: 'Forbidden: You do not have permission.' });
        // }

        const chamber = await Chamber.findByIdAndDelete(req.params.id);

        if (!chamber) {
            return res.status(404).json({ message: "Chamber not found" });
        }

        return res.status(200).json({ message: "Chamber deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};



