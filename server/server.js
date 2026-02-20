require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://nf-document-frontend.onrender.com',  // Your frontend URL (will get after deploy)
    process.env.FRONTEND_URL
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/files', require('./routes/files'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'NF Document Repository API',
    version: '1.0.0',
    status: 'running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Something went wrong!' 
  });
});

// Database connection (FIXED - No deprecated options)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log('Database:', mongoose.connection.name);
    initializeDefaultData();
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Initialize default admin user if not exists
async function initializeDefaultData() {
  try {
    const User = require('./models/User');
    
    // Check if admin exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        name: 'Admin',
        surname: 'User',
        username: 'admin',
        password: 'admin123',
        designation: 'System Administrator',
        role: 'admin',
        status: 'active'
      });
      await admin.save();
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }

    // Create default user
    const userExists = await User.findOne({ username: 'user1' });
    
    if (!userExists) {
      const user = new User({
        name: 'Test',
        surname: 'User',
        username: 'user1',
        password: 'user123',
        designation: 'Employee',
        role: 'user',
        status: 'active'
      });
      await user.save();
      console.log('✅ Default regular user created (username: user1, password: user123)');
    }

  } catch (error) {
    console.error('❌ Error initializing default data:', error.message);
  }
}

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 NF Document Repository Server                        ║
║                                                            ║
║   Server running on port ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║                                                            ║
║   API Endpoints:                                           ║
║   - Auth:    http://localhost:${PORT}/api/auth                ║
║   - Users:   http://localhost:${PORT}/api/users               ║
║   - Folders: http://localhost:${PORT}/api/folders             ║
║   - Files:   http://localhost:${PORT}/api/files               ║
║                                                            ║
║   Health Check: http://localhost:${PORT}/api/health           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = app;