const CMSContent = require('../models/CMSContent');
const LogService = require('../services/logService');

// Helper function to check permissions
const hasPermission = (user, permission) => {
    if (user.role === 'admin') return true;
    return user.permissions && user.permissions.includes(permission);
};

exports.getSectionContent = async (req, res) => {
    try {
        const { page, section } = req.params;
        const content = await CMSContent.findOne({ page, section });
        if (!content) {
            return res.status(404).json({ success: false, message: 'Content not found' });
        }
        res.json(content);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching content', error: error.message });
    }
};

exports.methodNotAllowed = (req, res) => {
    res.status(405).json({
        success: false,
        message: req.method === 'POST' ? 'Method Not Allowed. Use PUT to update section data.' : 'Method Not Allowed. To remove items, use PUT with the updated data array.'
    });
};

exports.updateSectionContent = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/cms:edit') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { page, section } = req.params;
        const { data: updatedData } = req.body;
        if (updatedData === undefined) {
            return res.status(400).json({ success: false, message: 'Invalid update payload. Must provide { data: ... }.' });
        }
        const currentContent = await CMSContent.findOne({ page, section });
        let updatedContent;
        if (currentContent) {
            updatedContent = await CMSContent.findOneAndUpdate(
                { page, section },
                { data: updatedData, updatedAt: new Date() },
                { new: true, runValidators: true }
            );
        } else {
            const newContent = new CMSContent({ page, section, data: updatedData });
            updatedContent = await newContent.save();
        }
        await LogService.logActivity({
            actor: req.user,
            action: currentContent ? 'UPDATE_CMS_CONTENT' : 'CREATE_CMS_CONTENT',
            entity: { type: 'CMSContent', id: updatedContent._id.toString(), name: `${page}/${section}` },
            details: { page, section, previousData: currentContent ? currentContent.data : null, updatedData },
            request: req
        });
        res.json(updatedContent);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating content', error: error.message });
    }
};

exports.getPageSections = async (req, res) => {
    try {
        const { page } = req.params;
        const contents = await CMSContent.find({ page }).sort({ section: 1 });
        res.json( contents );
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching page content', error: error.message });
    }
};

exports.getAllCMSContent = async (req, res) => {
    try {
        if (!req.user || (!hasPermission(req.user, '/dashboard/cms:read') && req.user.role !== 'admin')) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        // const { page = 1, limit = 20, search } = req.query;
        const query = {};
        // if (search) {
        //     query.$or = [
        //         { page: { $regex: search, $options: 'i' } },
        //         { section: { $regex: search, $options: 'i' } }
        //     ];
        // }
        const contents = await CMSContent.find()
           
        res.json(
           
                contents,
                // totalPages: Math.ceil(total / limit),
                // currentPage: page,
                // total
            // }
);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching CMS content' });
    }
};
