const mongoose = require('mongoose');

const parlorCmsSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        enum: ['home', 'about', 'contact', 'services', 'gallery'],
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

parlorCmsSchema.index({ page: 1, section: 1 }, { unique: true });

parlorCmsSchema.statics.findByPageAndSection = function (page, section) {
    return this.findOne({ page, section });
};

parlorCmsSchema.statics.updateByPageAndSection = function (page, section, data) {
    return this.findOneAndUpdate(
        { page, section },
        { data, updatedAt: new Date() },
        { new: true, upsert: true, runValidators: true }
    );
};

parlorCmsSchema.statics.getAllByPage = function (page) {
    return this.find({ page }).sort({ section: 1 });
};

parlorCmsSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
};

const ParlorCms = mongoose.model('ParlorCms', parlorCmsSchema, 'parlor_cms');

module.exports = ParlorCms;