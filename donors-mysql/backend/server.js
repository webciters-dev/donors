const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./src/models');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const config = require('./src/config/env');

// Import routes
const authRoutes = require('./src/routes/auth');
const studentRoutes = require('./src/routes/students');
const applicationRoutes = require('./src/routes/applications');
const donorRoutes = require('./src/routes/donors');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000, // Convert minutes to milliseconds
  max: config.RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/donors', donorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');

    // Start server
    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${config.NODE_ENV}`);
      console.log(`🌐 Frontend URL: ${config.FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;