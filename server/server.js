const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Load environment variables FIRST
// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '.env') });

// Database connection
const connectDB = require('./config/db');
const initDatabase = require('./utils/initDatabase');

// Connect to PostgreSQL
connectDB();

// Initialize database schema
(async () => {
  try {
    await initDatabase();
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
  }
})();

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
// In server.js, update socket.io configuration:
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// ========== MIDDLEWARE ==========
// CORS middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Session middleware - FIXED SETTINGS
app.use(session({
  secret: process.env.SESSION_SECRET || 'bus-tracking-secret-key-123',
  resave: true,  // CHANGED FROM false
  saveUninitialized: true,  // CHANGED FROM false
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',  // CHANGED FOR DEVELOPMENT
    secure: false  // CHANGED FOR DEVELOPMENT
  }
}));

// Make io accessible in controllers
app.set('io', io);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== TEMPORARY TEST ENDPOINTS ==========
// Add these BEFORE importing routes
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    session: req.session ? 'Session exists' : 'No session',
    sessionId: req.sessionID,
    timestamp: new Date()
  });
});

app.post('/api/test-login', (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Test login attempt:', email);

  // Accept any email with password 'admin123' for testing
  if (password === 'admin123') {
    const role = email.includes('admin') ? 'admin' :
      email.includes('driver') ? 'driver' : 'student';

    req.session.userId = 'test-user-' + Date.now();
    req.session.role = role;
    req.session.name = role.charAt(0).toUpperCase() + role.slice(1) + ' User';
    req.session.email = email;
    req.session.busAssigned = null;

    console.log('✅ Test login successful:', { email, role, sessionId: req.sessionID });

    return res.json({
      success: true,
      user: {
        id: req.session.userId,
        name: req.session.name,
        email: email,
        role: role,
        studentId: role === 'student' ? 'STU001' : null
      }
    });
  }

  res.status(401).json({
    success: false,
    message: 'Invalid credentials'
  });
});

app.get('/api/test-check', (req, res) => {
  res.json({
    authenticated: !!req.session.userId,
    session: req.session,
    sessionId: req.sessionID,
    timestamp: new Date()
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const driverRoutes = require('./routes/driverRoutes');
const studentRoutes = require('./routes/studentRoutes');
const busRoutes = require('./routes/busRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminNotificationRoutes = require('./routes/adminNotificationRoutes');

// Initialize Notification Service
const NotificationService = require('./services/notificationService');
global.notificationService = new NotificationService();

// ========== API ROUTES ==========
// API documentation at root
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Bus Tracking System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      bus: '/api/bus',
      driver: '/api/driver',
      student: '/api/student',
      test: '/api/test',
      'test-login': '/api/test-login'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: 'Connected',
    sessionSupport: true
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/admin/live', require('./routes/adminLiveRoutes'));
app.use('/api/notifications', notificationRoutes);


// ========== SOCKET.IO ==========
io.on('connection', (socket) => {
  console.log('🔌 Client connected via Socket.io - ID:', socket.id);

  // Heartbeat for connection monitoring
  socket.emit('connected', {
    message: 'Connected to WebSocket server',
    socketId: socket.id,
    timestamp: new Date()
  });

  // Join driver room
  socket.on('join-driver-room', (driverId) => {
    if (driverId) {
      socket.join(`driver-${driverId}`);
      console.log(`👨‍✈️ Driver ${driverId} connected to room driver-${driverId}`);

      socket.emit('driver-connected', {
        success: true,
        message: 'Driver dashboard connected',
        driverId: driverId,
        timestamp: new Date()
      });
    }
  });

  // Register for notifications (real-time push)
  socket.on('register-notifications', (userId) => {
    if (userId && global.notificationService) {
      global.notificationService.registerClient(userId, socket);
      console.log(`🔔 User ${userId} registered for notifications`);

      socket.emit('notification-ready', {
        success: true,
        message: 'Registered for real-time notifications',
        userId: userId
      });
    }
  });

  // Join bus room
  socket.on('join-bus-room', (busId) => {
    if (busId) {
      socket.join(`bus-${busId}`);
      console.log(`🚌 Client joined bus room: bus-${busId}`);
    }
  });

  // Handle live location updates from driver
  socket.on('driver-location-update', async (data) => {
    try {
      const { busId, latitude, longitude, speed, status } = data;

      if (!busId) {
        socket.emit('error', { message: 'Bus ID is required' });
        return;
      }

      console.log(`📍 Live update for bus ${busId}:`, { latitude, longitude, speed });

      // Broadcast to all students tracking this bus
      io.to(`bus-${busId}`).emit('bus-location-update', {
        success: true,
        busId: busId,
        latitude: latitude,
        longitude: longitude,
        speed: speed,
        status: status,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error updating bus location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected - ID: ${socket.id}, Reason: ${reason}`);

    // Cleanup notification service clients
    if (global.notificationService && socket.userId) {
      global.notificationService.unregisterClient(socket.userId);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Add heartbeat to keep connections alive
setInterval(() => {
  io.emit('heartbeat', {
    timestamp: new Date(),
    activeConnections: io.engine.clientsCount
  });
}, 30000); // Every 30 seconds

// ========== STATIC FILES ==========
// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  // The "catchall" handler: for any request that doesn't match one above
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  // Development mode - serve basic info
  app.get('/', (req, res) => {
    res.json({
      message: 'Bus Tracking System API - Development Mode',
      clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
      serverUrl: `http://localhost:${process.env.PORT || 5000}`,
      apiDocs: 'Available at /api endpoint'
    });
  });
}

// ========== ERROR HANDLERS ==========
// 404 for API routes
app.use('/api', (req, res, next) => {
  if (req.path === '/api' || req.path === '/api/health' || req.path === '/api/test') {
    return next();
  }
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// General error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);

  // Determine status code
  const statusCode = err.status || 500;

  // Error response
  const errorResponse = {
    success: false,
    message: err.message || 'Something went wrong!',
    path: req.path,
    method: req.method,
    timestamp: new Date()
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log('\n📝 TEST ENDPOINTS:');
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   POST http://localhost:${PORT}/api/test-login`);
  console.log(`   GET  http://localhost:${PORT}/api/test-check`);
  console.log('\n🔑 TEST CREDENTIALS:');
  console.log('   Email: admin@college.edu / driver@college.edu / student@college.edu');
  console.log('   Password: admin123 (for all)');
});