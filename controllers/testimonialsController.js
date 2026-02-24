const Testimonial = require('../models/Testimonial');
const LogService = require('../services/logService');
const FileManager = require('../services/fileManager');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

exports.getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });
        res.json(testimonials);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching testimonials' });
    }
};

exports.getTestimonialById = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }
        res.json({
            success: true,
            data: testimonial
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.createTestimonial = async (req, res) => {
    try {
        const { clientName, text, avatarUrl } = req.body;

        if (!clientName || !text) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const testimonialData = {
            clientName,
            text,
            avatarUrl: req.file ? `/uploads/${req.file.filename}` : (avatarUrl || 'https://placehold.co/100x100.png')
        };

        const testimonial = new Testimonial(testimonialData);
        const createdTestimonial = await testimonial.save();

        // Log activity (if user is authenticated)
        if (req.user) {
            await LogService.logActivity({
                actor: req.user,
                action: 'CREATE_TESTIMONIAL',
                entity: {
                    type: 'Testimonial',
                    id: createdTestimonial._id.toString(),
                    name: createdTestimonial.clientName
                },
                details: {
                    testimonial: createdTestimonial.toObject()
                },
                request: req
            });
        }

        res.status(201).json(createdTestimonial);
    } catch (error) {
        console.error("Error creating testimonial:", error);
        res.status(500).json({
            success: false,
            message: 'Error creating testimonial'
        });
    }
};

exports.updateTestimonial = async (req, res) => {
    try {
        // Check permissions
        if (!req.user || (!hasPermission(req.user, '/dashboard/testimonials:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        const { id } = req.params;

        // Get current testimonial for file cleanup
        const currentTestimonial = await Testimonial.findById(id);
        if (!currentTestimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }

        const updateData = { ...req.body };

        // Handle avatar upload
        if (req.file) {
            // Move old avatar to bin if it exists and is not the default placeholder
            if (currentTestimonial.avatarUrl && !currentTestimonial.avatarUrl.includes('placehold.co')) {
                await FileManager.moveFileToBin(currentTestimonial.avatarUrl);
            }
            updateData.avatarUrl = `/uploads/${req.file.filename}`;
        }

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedTestimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }

        // Log activity
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_TESTIMONIAL',
            entity: {
                type: 'Testimonial',
                id: updatedTestimonial._id.toString(),
                name: updatedTestimonial.clientName
            },
            details: {
                previousData: currentTestimonial.toObject(),
                updatedData: updateData
            },
            request: req
        });

        res.json({
            success: true,
            data: updatedTestimonial,
            message: 'Testimonial updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating testimonial'
        });
    }
};

exports.deleteTestimonial = async (req, res) => {
    try {
        // Check permissions
        if (!req.user || (!hasPermission(req.user, '/dashboard/testimonials:delete') && req.user.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        const { id } = req.params;

        // Get testimonial before deletion for logging and file cleanup
        const testimonialToDelete = await Testimonial.findById(id);
        if (!testimonialToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }

        // Move avatar to bin if it exists and is not the default placeholder
        if (testimonialToDelete.avatarUrl && !testimonialToDelete.avatarUrl.includes('placehold.co')) {
            await FileManager.moveFileToBin(testimonialToDelete.avatarUrl);
        }

        // Delete the testimonial
        const deletedTestimonial = await Testimonial.findByIdAndDelete(id);
        if (!deletedTestimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }

        // Log activity
        await LogService.logActivity({
            actor: req.user,
            action: 'DELETE_TESTIMONIAL',
            entity: {
                type: 'Testimonial',
                id: testimonialToDelete._id.toString(),
                name: testimonialToDelete.clientName
            },
            details: {
                deletedTestimonial: {
                    clientName: testimonialToDelete.clientName,
                    text: testimonialToDelete.text,
                    avatarUrl: testimonialToDelete.avatarUrl
                }
            },
            request: req
        });

        res.status(204).json({
            success: true,
            message: 'Testimonial deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting testimonial'
        });
    }
};
