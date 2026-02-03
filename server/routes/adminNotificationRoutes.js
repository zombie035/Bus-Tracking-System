// server/routes/adminNotificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// All admin notification routes require admin authentication
router.use(isAuthenticated);
router.use(isAdmin);

// Broadcast notification to all or specific role
router.post('/broadcast', notificationController.broadcastNotification);

// Get notification history
router.get('/history', notificationController.getNotificationHistory);

// Get notification statistics
router.get('/stats', notificationController.getNotificationStats);

module.exports = router;
