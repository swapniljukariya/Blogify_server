const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middleware/verifyToken');
const { createBlog } = require('../controllers/blogController');
const Blog = require('../models/BlogSchema');
const User = require('../models/User');

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// GET all blogs - UPDATED to use correct field names
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'fullName profileImage userName email')
      .sort({ createdAt: -1 });
    
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Server error fetching blogs' });
  }
});

// GET single blog by ID - ADD THIS ROUTE
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'fullName profileImage userName email');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    
    // Handle invalid ID format
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid blog ID format' });
    }
    
    res.status(500).json({ message: 'Server error fetching blog' });
  }
});

// POST create blog (your existing route)
router.post(
  '/',
  verifyToken,
  upload.single('coverImage'),
  createBlog
);

module.exports = router;