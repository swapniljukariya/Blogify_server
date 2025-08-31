const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5174',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser middleware with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Database connection with improved configuration
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.get('/', (req, res) => res.json({ 
  status: 'running',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
}));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/blog', require('./routes/blogRoute'));

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
  res.status(200).json({ 
    status: 'UP',
    database: dbStatus,
    uptime: process.uptime()
  });
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  
  // Differentiate between validation errors and server errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error',
      errors: err.errors 
    });
  }

  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Vercel-specific: Export as a serverless function
module.exports = app;

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
}