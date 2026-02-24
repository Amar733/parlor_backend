const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: { type: String, required: true, unique: true }, // e.g. "Medicine"
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
        old_id :{ type: String,default:""}, 

    categoryPath: { type: String }, // e.g. "Medicine / Capsule"
        status: { type: Boolean, default: false }, 

}, { timestamps: true });

// Pre-save hook to generate categoryPath
categorySchema.pre('save', async function (next) {
    if (this.parentCategory) {
        try {
            const parent = await mongoose.model('Category').findById(this.parentCategory);
            if (parent) {
                this.categoryPath = `${parent.categoryPath} / ${this.categoryName}`;
            } else {
                this.categoryPath = this.categoryName; // fallback if parent not found
            }
        } catch (err) {
            return next(err);
        }
    } else {
        this.categoryPath = this.categoryName; // root category
    }
    next();
});

module.exports = mongoose.model('Category', categorySchema, 'categories');
