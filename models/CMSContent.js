const mongoose = require('mongoose');

const cmsContentSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        enum: ['home', 'about', 'contact'],
        trim: true
    },
    section: {
        type: String,
        required: true,
        trim: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, {
    timestamps: true
});

// Create compound index for page and section (unique combination)
cmsContentSchema.index({ page: 1, section: 1 }, { unique: true });

// Static methods for easier queries
cmsContentSchema.statics.findByPageAndSection = function (page, section) {
    return this.findOne({ page, section });
};

cmsContentSchema.statics.updateByPageAndSection = function (page, section, data) {
    return this.findOneAndUpdate(
        { page, section },
        { data, updatedAt: new Date() },
        { new: true, upsert: true, runValidators: true }
    );
};

cmsContentSchema.statics.getAllByPage = function (page) {
    return this.find({ page }).sort({ section: 1 });
};

// Instance methods
cmsContentSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
};

const CMSContent = mongoose.model('CMSContent', cmsContentSchema, 'cms_content');

module.exports = CMSContent;
