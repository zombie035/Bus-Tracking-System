// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth Routes
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/check', authController.checkAuth);
router.post('/register', authController.register);
router.post('/create-test-accounts', authController.createTestAccounts);

module.exports = router;