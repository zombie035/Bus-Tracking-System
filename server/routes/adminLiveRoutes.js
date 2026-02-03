// server/routes/adminLiveRoutes.js
const express = require('express');
const router = express.Router();
const adminLiveController = require('../controllers/adminLiveController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// All routes require admin access
router.use(isAuthenticated);
router.use(isAdmin);

router.post('/message', adminLiveController.sendMessageToDriver);
router.put('/trip-status', adminLiveController.updateTripStatus);
router.post('/reassign', adminLiveController.reassignBus);

module.exports = router;
