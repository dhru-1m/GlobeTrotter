const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const itineraryRoutes = require('./routes/itinerary');
const userRoutes = require('./routes/users');
const activityRoutes = require('./routes/activities');
const cityRoutes = require('./routes/cities');
const budgetRoutes = require('./routes/budget');
const adminRoutes = require('./routes/admin');
const imagesRoutes = require('./routes/images');

const errorHandler = require('./middleware/errorHandler');
const { auth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS must be early so all later responses (incl. errors, rate limit) carry headers ---
const allowedOriginsEnv = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = allowedOriginsEnv.split(',').map(o => o.trim());
const corsOptions = {
  origin: function(origin, callback) {
    // Allow non-browser (no origin) or listed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  exposedHeaders: 'Content-Disposition'
};
app.use(cors(corsOptions));
// Explicit preflight handling for all routes
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet());
app.use(compression());

// Body parsing middleware (before rate limiting so body size errors still have CORS headers)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (after CORS so 429 has headers)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 1000 : 100),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GlobeTrotter API is running' });
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', auth, tripRoutes);
app.use('/api/itinerary', auth, itineraryRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/budget', auth, budgetRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imagesRoutes);

// Public routes (no auth required)
app.use('/api/trips/public', tripRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️ Starting server without database connection...');
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});

// Connect to database
connectDB();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;