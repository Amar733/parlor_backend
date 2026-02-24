const mongoose = require("mongoose");

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    imageUrl: {
      type: String,
      default: "https://placehold.co/600x400.png",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
blogPostSchema.index({ title: "text", content: "text" });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ date: -1 });

// Instance methods
blogPostSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
blogPostSchema.statics.findByAuthor = function (author) {
  return this.find({ author: new RegExp(author, "i") }).sort({ date: -1 });
};

blogPostSchema.statics.findRecent = function (limit = 10) {
  return this.find().sort({ date: -1 }).limit(limit);
};

blogPostSchema.statics.searchPosts = function (searchTerm) {
  return this.find({
    $or: [
      { title: { $regex: searchTerm, $options: "i" } },
      { content: { $regex: searchTerm, $options: "i" } },
      { author: { $regex: searchTerm, $options: "i" } },
    ],
  }).sort({ date: -1 });
};

const BlogPost = mongoose.model("BlogPost", blogPostSchema, "blog");

module.exports = BlogPost;
