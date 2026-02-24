const BlogPost = require("../models/BlogPost");
const LogService = require("../services/logService");
const FileManager = require("../services/fileManager");

// Helper function to check permissions
const hasPermission = (user, permission) => {
  if (user.role === "admin") return true;
  return user.permissions && user.permissions.includes(permission);
};

exports.getAllBlogPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getBlogPostById = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }
    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createBlogPost = async (req, res) => {
  try {
    // Check permissions
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/blog:create") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const { title, content, author, date, imageUrl } = req.body;

    if (!title || !content || !author || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const postData = {
      title,
      content,
      author,
      date,
      imageUrl: req.file
        ? `/uploads/${req.file.filename}`
        : imageUrl || "https://placehold.co/600x400.png",
    };

    const post = new BlogPost(postData);
    const createdPost = await post.save();

    // Log activity
    await LogService.logActivity({
      actor: req.user,
      action: "CREATE_BLOG_POST",
      entity: {
        type: "BlogPost",
        id: createdPost._id.toString(),
        name: createdPost.title,
      },
      details: {
        post: createdPost.toObject(),
      },
      request: req,
    });

    res.status(201).json({
      success: true,
      data: createdPost,
      message: "Blog post created successfully",
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({
      success: false,
      message: "Error creating blog post",
    });
  }
};

exports.updateBlogPost = async (req, res) => {
  try {
    // Check permissions
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/blog:edit") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const { id } = req.params;

    // Get current post for logging and file cleanup
    const currentPost = await BlogPost.findById(id);
    if (!currentPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    const updateData = { ...req.body };

    // Handle image upload
    if (req.file) {
      // Move old image to bin if it exists and is not a placeholder
      if (
        currentPost.imageUrl &&
        !currentPost.imageUrl.includes("placehold.co")
      ) {
        await FileManager.moveFileToBin(currentPost.imageUrl);
      }
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedPost = await BlogPost.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Log activity
    await LogService.logActivity({
      actor: req.user,
      action: "UPDATE_BLOG_POST",
      entity: {
        type: "BlogPost",
        id: updatedPost._id.toString(),
        name: updatedPost.title,
      },
      details: {
        previousData: currentPost.toObject(),
        updatedData: updateData,
      },
      request: req,
    });

    res.json({
      success: true,
      data: updatedPost,
      message: "Blog post updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating blog post",
    });
  }
};

exports.deleteBlogPost = async (req, res) => {
  try {
    // Check permissions
    if (
      !req.user ||
      (!hasPermission(req.user, "/dashboard/blog:delete") &&
        req.user.role !== "admin")
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const { id } = req.params;

    // Get post before deletion for logging and file cleanup
    const postToDelete = await BlogPost.findById(id);
    if (!postToDelete) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Move image to bin if it exists and is not a placeholder
    if (
      postToDelete.imageUrl &&
      !postToDelete.imageUrl.includes("placehold.co")
    ) {
      await FileManager.moveFileToBin(postToDelete.imageUrl);
    }

    const deletedPost = await BlogPost.findByIdAndDelete(id);
    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Log activity
    await LogService.logActivity({
      actor: req.user,
      action: "DELETE_BLOG_POST",
      entity: {
        type: "BlogPost",
        id: id,
        name: postToDelete.title,
      },
      details: {
        deletedPost: {
          title: postToDelete.title,
          author: postToDelete.author,
          imageUrl: postToDelete.imageUrl,
        },
      },
      request: req,
    });

    res.status(204).json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting blog post",
    });
  }
};
