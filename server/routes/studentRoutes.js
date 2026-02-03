const router = require('express').Router();
const studentController = require('../controllers/studentController');
const { isAuthenticated, isStudent, getStudentBus } = require('../middleware/authMiddleware');

// All student routes require authentication

// All student routes require authentication
router.use(isAuthenticated);
router.use(isStudent);

// Existing routes
router.get('/dashboard', studentController.dashboard);
router.get('/my-bus-location', studentController.getMyBusLocation);
router.get('/route-info', studentController.getRouteInfo);
router.get('/route-stops', studentController.getMyRouteStops);
router.get('/profile', studentController.getMyProfile);
router.put('/change-password', studentController.updatePassword);

// NEW ROUTES - Student Dashboard Enhancements

// Bus Status & Tracking
router.get('/bus-status', studentController.getBusStatus);
router.get('/eta-to-my-stop', studentController.getETAToMyStop);
router.get('/distance-to-bus', studentController.getDistanceToBus);
router.get('/next-stop', studentController.getNextStop);

// Schedule & Stops
router.get('/my-stop-details', studentController.getMyStopDetails);
router.get('/daily-schedule', studentController.getDailySchedule);

// Notifications & Announcements
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationRead);
router.get('/announcements', studentController.getAnnouncements);

// Communication
router.post('/contact-driver', studentController.sendContactMessage);
router.post('/contact-admin', studentController.sendContactMessage);
router.get('/quick-messages', studentController.getQuickMessages);

// Feedback & Reporting
router.post('/report-issue', studentController.reportIssue);
router.get('/feedback-history', studentController.getFeedbackHistory);

// Settings & Preferences
router.get('/settings', studentController.getSettings);
router.put('/settings', studentController.updateSettings);

module.exports = router;