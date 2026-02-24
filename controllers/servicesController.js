const LogService = require('../services/logService');
const Service = require('../models/Service');
// Helper function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};
exports.createService = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/services:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        const { name, description, price, doctor_ids } = req.body;

        if (!name || !description || price === undefined) {
            return res.status(400).json({
                message: 'Missing required fields'
            });
        }

        const serviceData = {
            name,
            description,
            price: Number(price),
            doctor_ids: doctor_ids || []
        };

        const service = new Service(serviceData);
        const createdService = await service.save();

        // Log activity
        await LogService.logActivity({
            actor: req.user,
            action: 'CREATE_SERVICE',
            entity: {
                type: 'Service',
                id: createdService._id.toString(),
                name: createdService.name
            },
            details: {
                service: createdService.toObject()
            },
            request: req
        });

        res.status(201).json({
            ...createdService.toObject(),
            id: createdService._id.toString()
        });
    } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({
            message: 'Error creating service'
        });
    }
};

exports.updateService = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/services:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        const { id } = req.params;

        // Get current service for logging
        const currentService = await Service.findById(id);
        if (!currentService) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }

        const updatedService = await Service.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedService) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }

        // Log activity
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_SERVICE',
            entity: {
                type: 'Service',
                id: updatedService._id.toString(),
                name: updatedService.name
            },
            details: {
                changes: req.body,
                service: updatedService.toObject(),
                previousData: currentService.toObject()
            },
            request: req
        });

        res.json({
            ...updatedService.toObject(),
            id: updatedService._id.toString()
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating service'
        });
    }
};

exports.deleteService = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/services:delete') && req.user.role !== 'admin')) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        const { id } = req.params;

        // Get service before deletion for logging
        const serviceToDelete = await Service.findById(id);
        if (!serviceToDelete) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }

        const deletedService = await Service.findByIdAndDelete(id);
        if (!deletedService) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }

        // Log activity
        await LogService.logActivity({
            actor: req.user,
            action: 'DELETE_SERVICE',
            entity: {
                type: 'Service',
                id: serviceToDelete._id.toString(),
                name: serviceToDelete.name
            },
            details: {
                deletedService: serviceToDelete.toObject()
            },
            request: req
        });

        res.status(204).json({
            message: 'Service deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting service'
        });
    }
};


exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.find().populate('doctor_ids', 'name email').sort({ createdAt: -1 });
        const servicesWithId = services.map(service => ({
            ...service.toObject(),
            id: service._id.toString()
        }));
        res.json(servicesWithId);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).populate('doctor_ids', 'name email');
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.json({ ...service.toObject(), id: service._id.toString() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getServicesByDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const services = await Service.findByDoctor(doctorId).populate('doctor_ids', 'name email');
        const servicesWithId = services.map(service => ({
            ...service.toObject(),
            id: service._id.toString()
        }));
        res.json(servicesWithId);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDoctorsByService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const service = await Service.findById(serviceId).populate('doctor_ids', 'name email phone role');
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.json(service.doctor_ids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
