const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Existing routes would go here (e.g., router.get('/', ...))

// Reset Password Route
// POST /api/admin/users/reset-password
router.post('/reset-password', protect, admin, userController.resetPassword);

module.exports = router;