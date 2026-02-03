// server/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(isAuthenticated);

// Get user's notifications
router.get('/', notificationController.getNotifications);

// Create notification (admin and drivers can create)
router.post('/', notificationController.createNotification);

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete/dismiss notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
