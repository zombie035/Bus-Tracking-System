// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const busController = require('../controllers/busController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const { pool } = require('../config/db');

// Apply admin middleware to all routes
router.use(isAuthenticated);
router.use(isAdmin);

// ========== DASHBOARD ==========
router.get('/dashboard', adminController.dashboard);

// ========== USER MANAGEMENT ==========
router.get('/users', adminController.getUsers);                // GET all users
router.get('/users/:id', adminController.getUser);             // GET single user
router.post('/users', adminController.createUser);             // CREATE user
router.put('/users/:id', adminController.updateUser);          // UPDATE user
router.delete('/users/:id', adminController.deleteUser);       // DELETE user
router.post('/users/bulk-import', adminController.bulkImport); // BULK import
router.post('/users/reset-password', userController.resetPassword); // RESET password

// ========== BUS MANAGEMENT ==========
// Consolidating bus management to use busController for consistency and security.
router.get('/buses', busController.getBuses);
router.get('/buses/:id', busController.getBus);
router.post('/buses', busController.createBus);
router.put('/buses/:id', busController.updateBus);
router.delete('/buses/:id', busController.deleteBus);
router.post('/buses/:id/location', busController.updateBusLocation);

// ========== ROUTE MANAGEMENT ==========
router.get('/routes', adminController.getRoutes);          // GET all routes
router.post('/routes', adminController.createRoute);       // CREATE route
router.get('/routes/:id', adminController.getRoute);       // GET single route
router.put('/routes/:id', adminController.updateRoute);    // UPDATE route
router.delete('/routes/:id', adminController.deleteRoute); // DELETE route

// ========== DRIVER MANAGEMENT ==========
router.get('/drivers/available', busController.getAvailableDrivers);

// ========== ANALYTICS ==========
router.get('/analytics/routes', adminController.getRouteAnalytics);
router.get('/analytics/usage', adminController.getUsageAnalytics);

// ========== DRIVER STATUS ==========
router.get('/drivers/status', adminController.getDriverStatus);


// Add this to your server.js or adminRoutes.js for testing
router.get('/test-db', async (req, res) => {
  try {
    // Test database connection
    const dbTest = await pool.query('SELECT NOW() as time');

    // Test buses table
    const busesCount = await pool.query('SELECT COUNT(*) FROM buses');

    // Test routes table
    const routesCount = await pool.query('SELECT COUNT(*) FROM routes');

    // Test users table
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');

    res.json({
      success: true,
      database: {
        connected: true,
        time: dbTest.rows[0].time
      },
      tables: {
        buses: parseInt(busesCount.rows[0].count),
        routes: parseInt(routesCount.rows[0].count),
        users: parseInt(usersCount.rows[0].count)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
});


module.exports = router;