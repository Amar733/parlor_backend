const ParlorCms = require('../models/ParlorCms');

exports.getSectionContent = async (req, res) => {
    try {
        const { page, section } = req.params;
        const content = await ParlorCms.findOne({ page, section });
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
        const { page, section } = req.params;
        const { data: updatedData } = req.body;
        if (updatedData === undefined) {
            return res.status(400).json({ success: false, message: 'Invalid update payload. Must provide { data: ... }.' });
        }
        const currentContent = await ParlorCms.findOne({ page, section });
        let updatedContent;
        if (currentContent) {
            updatedContent = await ParlorCms.findOneAndUpdate(
                { page, section },
                { data: updatedData, updatedAt: new Date() },
                { new: true, runValidators: true }
            );
        } else {
            const newContent = new ParlorCms({ page, section, data: updatedData });
            updatedContent = await newContent.save();
        }
        res.json(updatedContent);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating content', error: error.message });
    }
};

exports.getPageSections = async (req, res) => {
    try {
        const { page } = req.params;
        const contents = await ParlorCms.find({ page }).sort({ section: 1 });
        res.json(contents);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching page content', error: error.message });
    }
};

exports.getAllCMSContent = async (req, res) => {
    try {
        const contents = await ParlorCms.find();
        res.json(contents);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching CMS content' });
    }
};