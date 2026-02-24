const PrescriptionSettings = require('../models/PrescriptionSettings');

// Get prescription settings for authenticated doctor
exports.getSettings = async (req, res) => {
    try {
        const { doctor_id } = req.query;

        const settings = await PrescriptionSettings.findOne({ doctor_id: doctor_id });

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Settings not found, using defaults'
            });
        }

        res.json({
            success: true,
            data: {
                headerColor: settings.headerColor,
                logoShape: settings.logoShape,
                fontStyle: settings.fontStyle,
                fontSize: settings.fontSize,
                textColor: settings.textColor
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create or Update prescription settings (Upsert)
exports.updateSettings = async (req, res) => {
    try {
        const { doctor_id, headerColor, logoShape, fontStyle, fontSize, textColor } = req.body;

        // Check if settings already exist
        const existingSettings = await PrescriptionSettings.findOne({ doctor_id: doctor_id });

        if (existingSettings) {
            // Update existing settings
            const updateData = {};
            if (headerColor !== undefined) updateData.headerColor = headerColor;
            if (logoShape !== undefined) updateData.logoShape = logoShape;
            if (fontStyle !== undefined) updateData.fontStyle = fontStyle;
            if (fontSize !== undefined) updateData.fontSize = fontSize;
            if (textColor !== undefined) updateData.textColor = textColor;

            const settings = await PrescriptionSettings.findOneAndUpdate(
                { doctor_id: doctor_id },
                updateData,
                { new: true, runValidators: true }
            );

            return res.json({
                success: true,
                message: 'Settings updated successfully',
                data: {
                    _id: settings._id,
                    headerColor: settings.headerColor,
                    logoShape: settings.logoShape,
                    fontStyle: settings.fontStyle,
                    fontSize: settings.fontSize,
                    textColor: settings.textColor,
                    updatedAt: settings.updatedAt
                }
            });
        }

        // Create new settings
        const settings = await PrescriptionSettings.create({
            doctor_id: doctor_id,
            headerColor,
            logoShape,
            fontStyle,
            fontSize,
            textColor
        });

        res.status(201).json({
            success: true,
            message: 'Settings created successfully',
            data: {
                _id: settings._id,
                headerColor: settings.headerColor,
                logoShape: settings.logoShape,
                fontStyle: settings.fontStyle,
                fontSize: settings.fontSize,
                textColor: settings.textColor
            }
        });
    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// Delete prescription settings (reset to defaults)
exports.deleteSettings = async (req, res) => {
    try {
        const { doctor_id } = req.body;

        await PrescriptionSettings.findOneAndDelete({ doctor_id: doctor_id });

        res.json({
            success: true,
            message: 'Settings reset to defaults'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
