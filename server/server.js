const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

// Load environment variables
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
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // In development, allow ANY origin (or specific patterns if preferred)
      // This enables mobile testing via LAN IP
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Production logic...
      const allowedOrigins = [
        process.env.CLIENT_URL,
        'http://localhost:3000'
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');



// ========== OPTIMIZATION MIDDLEWARE ==========

// 1. Compression (Gzip) - Drastically reduces response size
app.use(compression());

// 2. Helmet - Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid React conflicts
  crossOriginEmbedderPolicy: false
}));

// 3. Rate Limiting - Prevent Abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes' // Fixed typo
});
app.use('/api', limiter);

// ========== STANDARD MIDDLEWARE ==========
// CORS Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow ANY origin
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Production logic
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:3000'
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session middleware - FIXED SETTINGS
app.use(session({
  secret: process.env.SESSION_SECRET || 'bus-tracking-secret-key-123',
  resave: false, // Optimized: don't save session if unmodified
  saveUninitialized: false, // Optimized: don't create session until something stored
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production' // true in production
  }
}));

// Make io accessible in controllers
app.set('io', io);



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

  // Register for notifications (real-time push) - Enhanced with session tracking
  socket.on('register-notifications', (userId) => {
    if (userId && global.notificationService) {
      // Store userId on socket for cleanup
      socket.userId = userId;
      global.notificationService.registerClient(userId, socket);
      console.log(`� User ${userId} registered for notifications`);

      // Emit confirmation
      socket.emit('notification-ready', {
        success: true,
        message: 'Registered for real-time notifications',
        userId: userId
      });
    }
  });

  // Auto-register for students based on session
  socket.on('authenticate-session', (sessionData) => {
    const { userId, role } = sessionData;
    if (userId && role === 'student' && global.notificationService) {
      socket.userId = userId;
      global.notificationService.registerClient(userId, socket);
      console.log(`� Auto-registered student ${userId} for notifications`);

      socket.emit('notification-ready', {
        success: true,
        message: 'Auto-registered for notifications',
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
  if (req.path === '/api' || req.path === '/api/health') {
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
});