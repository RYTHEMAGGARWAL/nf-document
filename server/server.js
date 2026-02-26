require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'https://nf-document-frontend.onrender.com',
       'https://nf-document.vercel.app',
      process.env.FRONTEND_URL
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/files', require('./routes/files'));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'NF Document Repository API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      folders: '/api/folders',
      files: '/api/files'
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    console.log('📦 Database:', mongoose.connection.name);
    
    // Initialize default data after connection
    await initializeDefaultData();
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    // Don't exit, keep trying
    setTimeout(connectDB, 5000);
  }
};

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
      console.log('✅ Default admin created (username: admin, password: admin123)');
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
      console.log('✅ Default user created (username: user1, password: user123)');
    }

  } catch (error) {
    console.error('⚠️ Error initializing default data:', error.message);
  }
}

// Connect to database
connectDB();

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
║   Ready to accept connections!                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Keep alive - prevent idle shutdown
setInterval(() => {
  console.log('💓 Heartbeat - Server alive');
}, 60000); // Every minute

// Handle errors gracefully
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  // Don't exit - log and continue
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Don't exit - log and continue
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;