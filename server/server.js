require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
    timestamp: new Date()
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

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  initializeDefaultData();
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
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
    console.error('Error initializing default data:', error);
  }
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
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
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});