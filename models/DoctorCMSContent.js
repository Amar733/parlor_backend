const mongoose = require('mongoose');

const doctorCMSContentSchema = new mongoose.Schema({
    doctor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedUser',
        required: true
    },
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

// Create correct compound index with doctor_id
doctorCMSContentSchema.index({ doctor_id: 1, page: 1, section: 1 }, { unique: true });

// Static methods for easier queries
doctorCMSContentSchema.statics.findByPageAndSection = function (doctor_id, page, section) {
    return this.findOne({ doctor_id, page, section });
};

doctorCMSContentSchema.statics.updateByPageAndSection = function (doctor_id, page, section, data) {
    return this.findOneAndUpdate(
        { doctor_id, page, section },
        { data, updatedAt: new Date() },
        { new: true, upsert: true, runValidators: true }
    );
};

doctorCMSContentSchema.statics.getAllByPage = function (doctor_id, page) {
    return this.find({ doctor_id, page }).sort({ section: 1 });
};

// Instance methods
doctorCMSContentSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj._id;
    delete obj.__v;
    return obj;
};

const DoctorCMSContent = mongoose.model('DoctorCMSContent', doctorCMSContentSchema, 'doctor_cms_content');

module.exports = DoctorCMSContent;
