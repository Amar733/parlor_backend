const DoctorCMSContent = require("../models/DoctorCMSContent");

exports.getSectionContent = async (req, res) => {
    try {
        const { doctor_id, page, section } = req.params;
        const content = await DoctorCMSContent.findOne({ doctor_id, page, section });
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
        const { doctor_id, page, section } = req.params;
        const { data: updatedData } = req.body;
        
        if (updatedData === undefined) {
            return res.status(400).json({ success: false, message: 'Invalid update payload. Must provide { data: ... }.' });
        }
        
        // First find existing content for this doctor, page, and section
        const existingContent = await DoctorCMSContent.findOne({ doctor_id, page, section });
        
        let updatedContent;
        if (existingContent) {
            // Update existing content
            updatedContent = await DoctorCMSContent.findByIdAndUpdate(
                existingContent._id,
                { data: updatedData },
                { new: true, runValidators: true }
            );
        } else {
            // Create new content
            updatedContent = await DoctorCMSContent.create({
                doctor_id,
                page,
                section,
                data: updatedData
            });
        }
        
        res.json(updatedContent);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating content', error: error.message });
    }
};

exports.getPageSections = async (req, res) => {
    try {
        const { doctor_id, page } = req.params;
        const contents = await DoctorCMSContent.find({ doctor_id, page }).sort({ section: 1 });
        res.json(contents);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching page content', error: error.message });
    }
};

exports.getAllCMSContent = async (req, res) => {
    try {
        const { doctor_id } = req.params;
        const contents = await DoctorCMSContent.find({ doctor_id });
        res.json(contents);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching CMS content' });
    }
};

exports.deleteAllCMSContent = async (req, res) => {
    try {
        const result = await DoctorCMSContent.deleteMany({});
        res.json({ 
            success: true, 
            message: 'All DoctorCMS content deleted successfully', 
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting CMS content', error: error.message });
    }
};
