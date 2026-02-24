const DoctorVisiting = require('../models/doctorVisiting');
const Chamber = require('../models/chamber');

// function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

// Create Doctor Visiting Entry
exports.createDoctorVisiting = async (req, res) => {
    try {
        const {
            doctorId,
            chamber,
            patientName,
            patientEmail,
            patientPhone,
            patientCity,
            patientAge,
            patientGender,
            patientFile,
            notes
            
        } = req.body;

        const visiting = await DoctorVisiting.create({
            doctorId,
            chamber,
            patientName,
            patientEmail,
            patientPhone,
            patientCity,
            patientAge,
            patientGender,
            patientFile,
            notes
        });

        return res.status(201).json({
            message: "Doctor visiting entry created successfully",
            data: visiting
        });

    } catch (error) {
        return res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// Get All Doctor Visiting Entries
exports.getDoctorVisiting = async (req, res) => {
    try {
        const visitingList = await DoctorVisiting.find()
            .populate("doctorId", "name email")
            .populate("chamber", "chamberName city");

        return res.status(200).json({
            message: "Doctor visiting entries fetched successfully",
            data: visitingList
        });

    } catch (error) {
        return res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// Get a Single Entry By ID
exports.getDoctorVisitingById = async (req, res) => {
    try {
        const visiting = await DoctorVisiting.findById(req.params.id)
            .populate("doctorId", "name email")
            .populate("chamber", "chamberName city");

        if (!visiting) {
            return res.status(404).json({ message: "Entry not found" });
        }

        return res.status(200).json({
            message: "Doctor visiting entry fetched successfully",
            data: visiting
        });

    } catch (error) {
        return res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// Get Doctor Visiting Entries by Doctor ID
exports.getDoctorVisitingByDoctorId = async (req, res) => {
    try {
        const visitingList = await DoctorVisiting.find({ doctorId: req.params.doctorId })
            .populate("doctorId", "name email")
            .populate("chamber", "chamberName city");

        return res.status(200).json({
            message: "Doctor visiting entries fetched successfully",
            data: visitingList
        });

    } catch (error) {
        return res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// Update Doctor Visiting Entry
exports.updateDoctorVisiting = async (req, res) => {
    try {
        const updated = await DoctorVisiting.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate("doctorId", "name email")
         .populate("chamber", "chamberName city");

        if (!updated) {
            return res.status(404).json({ message: "Entry not found" });
        }

        return res.status(200).json({
            message: "Doctor visiting entry updated successfully",
            data: updated
        });

    } catch (error) {
        return res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};

// Delete Doctor Visiting Entry
exports.deleteDoctorVisiting = async (req, res) => {
    try {
        const deleted = await DoctorVisiting.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Entry not found" });
        }

        return res.status(200).json({
            message: "Doctor visiting entry deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
};
