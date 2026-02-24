exports.getAllSpecializations = async (req, res) => {
    try {
        const ManagedUser = require('../models/ManagedUser');
        const specializations = await ManagedUser.distinct('specialization', {
            role: 'doctor',
            specialization: { $exists: true, $ne: null, $ne: '' }
        });
        res.json({
            success: true,
            data: specializations.filter(spec => spec && spec.trim())
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const ManagedUser = require('../models/ManagedUser');
exports.getAllDoctors = async (req, res) => {
    try {
        const users = await ManagedUser.find({ role: 'doctor' });
        const publicDoctors = users.map(doctor => ({
            id: doctor._id,
            name: doctor.name,
            specialization: doctor.specialization,
            bio: doctor.bio,
            avatarUrl: doctor.avatarUrl,
        }));
        res.json(publicDoctors);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctors'
        });
    }
};

exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await ManagedUser.findOne({
            _id: req.params.id,
            role: 'doctor'
        });
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }
        const publicDoctor = {
            id: doctor._id,
            name: doctor.name,
            specialization: doctor.specialization,
            bio: doctor.bio,
            avatarUrl: doctor.avatarUrl,
        };
        res.json(publicDoctor);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor'
        });
    }
};
