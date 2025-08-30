const Blog = require('../models/BlogSchema');

exports.createBlog = async (req, res) => {
  try {
    console.log('Raw Request Body:', req.body);

    // Safely get fields without destructuring
    const title = req.body?.title;
    const content = req.body?.content;
    
    // Handle tags parsing correctly
    let tags = ['blog']; // Default value
    
    if (req.body.tags) {
      try {
        // Check if tags is already an array (shouldn't happen with formdata, but just in case)
        if (Array.isArray(req.body.tags)) {
          tags = req.body.tags;
        } else if (typeof req.body.tags === 'string') {
          // For formdata, tags comes as a string like "tag1,tag2,tag3"
          tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        }
      } catch (e) {
        console.log('Invalid tags format, using default');
      }
    }

    if (!title || !content) {
      return res.status(400).json({ 
        message: 'Title and content are required',
        received: { title, content }
      });
    }

    const blog = new Blog({
      title,
      content,
      tags,
      coverImage: req.file?.filename,
      author: req.user.id
    });

    await blog.save();
    res.status(201).json({ message: 'Blog created', blog });
    
  } catch (err) {
    console.error('Full Error:', {
      error: err.message,
      stack: err.stack,
      receivedBody: req.body
    });
    res.status(500).json({ 
      message: 'Failed to create blog',
      error: err.message,
      receivedData: { body: req.body, file: req.file }
    });
  }
};

// Other controller methods remain the same...

// Get All Blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'userName email') // Populate only specific fields
      .sort({ createdAt: -1 });

    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blogs', error: err.message });
  }
};

// Get Single Blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'userName email');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blog', error: err.message });
  }
};

// Delete Blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    // Optional: Check if the logged-in user is the author
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this blog' });
    }

    await blog.deleteOne();
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete blog', error: err.message });
  }
};
