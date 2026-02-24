const express = require('express');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const blogController = require('../controllers/blogController');
const router = express.Router();

// @route   GET /api/blog
// @desc    Get all blog posts
// @access  Public
router.get('/', blogController.getAllBlogPosts);

// @route   GET /api/blog/:id
// @desc    Get blog post by ID
// @access  Public
router.get('/:id', blogController.getBlogPostById);

// @route   POST /api/blog
// @desc    Create new blog post
// @access  Private
router.post('/', auth, upload.single('image'), blogController.createBlogPost);

// @route   PUT /api/blog/:id
// @desc    Update blog post
// @access  Private (Admin or users with edit permission)
router.put('/:id', auth, upload.single('image'), blogController.updateBlogPost);

// @route   DELETE /api/blog/:id
// @desc    Delete blog post
// @access  Private (Admin or users with delete permission)
router.delete('/:id', auth, blogController.deleteBlogPost);

module.exports = router;
