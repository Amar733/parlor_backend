const PortfolioItem = require('../models/PortfolioItem');
const LogService = require('../services/logService');
const FileManager = require('../services/fileManager');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

exports.getAllPortfolioItems = async (req, res) => {
    try {
        const items = await PortfolioItem.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching portfolio items'
        });
    }
};

exports.getPortfolioItemById = async (req, res) => {
    try {
        const portfolioItem = await PortfolioItem.findById(req.params.id);
        if (!portfolioItem) {
            return res.status(404).json({
                success: false,
                message: 'Portfolio item not found'
            });
        }
        res.json({
            success: true,
            data: portfolioItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.createPortfolioItem = async (req, res) => {
    try {
        const { title, imageUrl } = req.body;
        if (!title || !imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        const portfolioData = {
            title,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : imageUrl
        };
        const portfolioItem = new PortfolioItem(portfolioData);
        const createdItem = await portfolioItem.save();
        if (req.user) {
            await LogService.logActivity({
                actor: req.user,
                action: 'CREATE_PORTFOLIO_ITEM',
                entity: {
                    type: 'PortfolioItem',
                    id: createdItem._id.toString(),
                    name: createdItem.title
                },
                details: {
                    portfolioItem: createdItem.toObject()
                },
                request: req
            });
        }
        res.status(201).json(createdItem);
    } catch (error) {
        console.error("Error creating portfolio item:", error);
        res.status(500).json({
            success: false,
            message: 'Error creating portfolio item'
        });
    }
};

exports.updatePortfolioItem = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/portfolio:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }
        const { id } = req.params;
        const currentItem = await PortfolioItem.findById(id);
        if (!currentItem) {
            return res.status(404).json({
                success: false,
                message: 'Portfolio item not found'
            });
        }
        const updateData = { ...req.body };
        if (req.file) {
            if (currentItem.imageUrl && !currentItem.imageUrl.includes('placehold.co')) {
                await FileManager.moveFileToBin(currentItem.imageUrl);
            }
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }
        const updatedItem = await PortfolioItem.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!updatedItem) {
            return res.status(404).json({
                success: false,
                message: 'Portfolio item not found'
            });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'UPDATE_PORTFOLIO_ITEM',
            entity: {
                type: 'PortfolioItem',
                id: updatedItem._id.toString(),
                name: updatedItem.title
            },
            details: {
                previousData: currentItem.toObject(),
                updatedData: updateData
            },
            request: req
        });
        res.json({
            success: true,
            data: updatedItem,
            message: 'Portfolio item updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating portfolio item'
        });
    }
};

exports.deletePortfolioItem = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/portfolio:delete') && req.user.role !== 'admin')) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }
        const { id } = req.params;
        const itemToDelete = await PortfolioItem.findById(id);
        if (!itemToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Portfolio item not found'
            });
        }
        if (itemToDelete.imageUrl && !itemToDelete.imageUrl.includes('placehold.co')) {
            await FileManager.moveFileToBin(itemToDelete.imageUrl);
        }
        const deletedItem = await PortfolioItem.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({
                success: false,
                message: 'Portfolio item not found'
            });
        }
        await LogService.logActivity({
            actor: req.user,
            action: 'DELETE_PORTFOLIO_ITEM',
            entity: {
                type: 'PortfolioItem',
                id: itemToDelete._id.toString(),
                name: itemToDelete.title
            },
            details: {
                deletedItem: {
                    title: itemToDelete.title,
                    imageUrl: itemToDelete.imageUrl
                }
            },
            request: req
        });
        res.status(204).json({
            success: true,
            message: 'Portfolio item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting portfolio item'
        });
    }
};
