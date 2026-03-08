// server/routes/driverRoutes.js
const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { isAuthenticated, isDriver } = require('../middleware/authMiddleware');

// Apply driver middleware to all routes
router.use(isAuthenticated);
router.use(isDriver);

// Existing Routes
router.get('/dashboard', driverController.dashboard);
router.get('/my-bus', driverController.getMyBus);
router.post('/update-live-location', driverController.updateLiveLocation);
router.post('/start-trip', driverController.startTrip);
router.post('/end-trip', driverController.endTrip);

// ==============================================
// ENHANCED DRIVER FEATURES
// ==============================================

// Route & Schedule Management
router.get('/assigned-route', driverController.getAssignedRoute);
router.get('/schedule', driverController.getSchedule);
router.put('/current-stop', driverController.updateCurrentStop);

// Delay Reporting
router.post('/report-delay', driverController.reportDelay);
router.get('/delay-history', driverController.getDelayHistory);

// Student Management
router.get('/student-list', driverController.getStudentPickupList);

// Notifications
router.get('/notifications', driverController.getNotifications);
router.put('/notifications/:id/read', driverController.markNotificationRead);

// Emergency & Quick Messages
router.post('/emergency', driverController.sendEmergencyAlert);
router.post('/quick-message', driverController.sendQuickMessage);
router.get('/quick-messages', driverController.getQuickMessages);

// Profile & Settings
router.get('/profile', driverController.getProfile);
router.get('/settings', driverController.getSettings);
router.put('/settings', driverController.updateSettings);

// Bus Details
router.get('/bus-details', driverController.getBusDetails);
router.get('/bus-details/:driverName', driverController.getBusDetailsByDriverName);
router.get('/bus-by-driver-id/:driverId', driverController.getBusDetailsByDriverId);

module.exports = router;