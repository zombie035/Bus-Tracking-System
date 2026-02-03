// client/src/services/busService.js
import api from './api';

export const busService = {
  // Make sure we're calling the correct endpoints
  getAllBuses: async () => {
    try {
      let response;
      try {
        // For admin dashboard, always try the admin endpoint first
        response = await api.get('/api/admin/buses');
      } catch (adminError) {
        console.log('Admin endpoint failed, trying public endpoint...');
        // Fallback to public endpoint
        response = await api.get('/api/buses');
      }
      console.log('Bus service response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching buses:', error);
      return { success: false, buses: [] };
    }
  },

  getBus: async (busId) => {
    try {
      let response;
      try {
        response = await api.get(`/api/admin/buses/${busId}`);
      } catch (adminError) {
        response = await api.get(`/api/buses/${busId}`);
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching bus:', error);
      return { success: false };
    }
  },

  createBus: async (busData) => {
    try {
      console.log('🚌 Creating bus with data:', busData);

      // Ensure we're sending the correct data structure
      const formattedData = {
        busNumber: busData.busNumber,
        routeName: busData.routeName,
        capacity: parseInt(busData.capacity),
        status: busData.status || 'active',
        driverId: busData.driverId || null,
        latitude: parseFloat(busData.latitude),
        longitude: parseFloat(busData.longitude)
      };

      console.log('📤 Formatted bus data:', formattedData);

      const response = await api.post('/api/admin/buses', formattedData);
      console.log('✅ Create bus response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating bus:', error);
      console.error('Error response:', error.response?.data);

      // Extract the most specific error message available
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to create bus';

      return {
        success: false,
        message: errorMessage
      };
    }
  },

  updateBus: async (busId, busData) => {
    try {
      console.log('🔄 Updating bus:', busId, busData);

      const formattedData = {
        busNumber: busData.busNumber,
        routeName: busData.routeName,
        capacity: parseInt(busData.capacity),
        status: busData.status,
        driverId: busData.driverId || null,
        latitude: parseFloat(busData.latitude),
        longitude: parseFloat(busData.longitude)
      };

      console.log('📤 Formatted update data:', formattedData);

      const response = await api.put(`/api/admin/buses/${busId}`, formattedData);
      console.log('✅ Update bus response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating bus:', error);
      console.error('Error response:', error.response?.data);

      // Extract the most specific error message available
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to update bus';

      return {
        success: false,
        message: errorMessage
      };
    }
  },

  deleteBus: async (busId) => {
    try {
      console.log('🗑️ Deleting bus:', busId);
      const response = await api.delete(`/api/admin/buses/${busId}`);
      console.log('✅ Delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting bus:', error);
      console.error('Error response:', error.response?.data);

      // Extract the most specific error message available
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to delete bus';

      return {
        success: false,
        message: errorMessage
      };
    }
  },

  getAvailableDrivers: async () => {
    try {
      const response = await api.get('/api/admin/drivers/available');
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Try alternative endpoint
      try {
        const userResponse = await api.get('/api/admin/users?role=driver');
        return userResponse.data;
      } catch (userError) {
        return { success: false, drivers: [] };
      }
    }
  },

  updateBusLocation: async (busId, locationData) => {
    try {
      const response = await api.post(`/api/admin/buses/${busId}/location`, locationData);
      return response.data;
    } catch (error) {
      console.error('Error updating bus location:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to update location' };
    }
  },

  getLiveBuses: async () => {
    try {
      const response = await api.get('/api/buses/live');
      return response.data;
    } catch (error) {
      console.error('Error fetching live buses:', error);
      return { success: false, buses: [] };
    }
  },

  getRoutes: async () => {
    try {
      const response = await api.get('/api/admin/routes');
      return response.data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      return { success: false, routes: [] };
    }
  },

  createRoute: async (routeData) => {
    try {
      const response = await api.post('/api/admin/routes', routeData);
      return response.data;
    } catch (error) {
      console.error('Error creating route:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to create route' };
    }
  },

  // Admin Live Controls
  sendMessageToDriver: async (data) => {
    try {
      const response = await api.post('/api/admin/live/message', data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to send message' };
    }
  },

  updateTripStatus: async (data) => {
    try {
      const response = await api.put('/api/admin/live/trip-status', data);
      return response.data;
    } catch (error) {
      console.error('Error updating trip status:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to update trip status' };
    }
  },

  reassignBus: async (data) => {
    try {
      const response = await api.post('/api/admin/live/reassign', data);
      return response.data;
    } catch (error) {
      console.error('Error reassigning bus:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to reassign bus' };
    }
  },

  // Driver-specific methods
  getMyBus: async () => {
    try {
      console.log('🚌 Fetching driver\'s assigned bus...');
      const response = await api.get('/api/driver/my-bus');
      console.log('   Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching driver bus:', error);
      return { success: false, message: error.message };
    }
  },

  updateLocation: async (locationData) => {
    try {
      const response = await api.post('/api/driver/update-live-location', locationData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating location:', error);
      return { success: false, message: error.message };
    }
  },

  startTrip: async () => {
    try {
      console.log('🚀 Starting trip...');
      const response = await api.post('/api/driver/start-trip');
      console.log('   Trip started:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error starting trip:', error);
      return { success: false, message: error.message };
    }
  },

  endTrip: async () => {
    try {
      console.log('🛑 Ending trip...');
      const response = await api.post('/api/driver/end-trip');
      console.log('   Trip ended:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error ending trip:', error);
      return { success: false, message: error.message };
    }
  },

  getRouteStops: async (routeId) => {
    try {
      console.log('🗺️ Fetching route stops for route:', routeId);
      // Fixed URL: must match the mounted path in server.js (/api/buses) + route path (/routes/:id/stops)
      const response = await api.get(`/api/buses/routes/${routeId}/stops`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching route stops:', error);
      return { success: false, stops: [] };
    }
  },

  // ==============================================
  // ENHANCED DRIVER FEATURES
  // ==============================================

  // Route & Schedule
  getAssignedRoute: async () => {
    try {
      const response = await api.get('/api/driver/assigned-route');
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned route:', error);
      return { success: false, message: error.message };
    }
  },

  getSchedule: async () => {
    try {
      const response = await api.get('/api/driver/schedule');
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return { success: false, message: error.message };
    }
  },

  // Delay Reporting
  reportDelay: async (delayData) => {
    try {
      const response = await api.post('/api/driver/report-delay', delayData);
      return response.data;
    } catch (error) {
      console.error('Error reporting delay:', error);
      return { success: false, message: error.message };
    }
  },

  getDelayHistory: async () => {
    try {
      const response = await api.get('/api/driver/delay-history');
      return response.data;
    } catch (error) {
      console.error('Error fetching delay history:', error);
      return { success: false, message: error.message };
    }
  },

  // Student Management
  getStudentList: async () => {
    try {
      const response = await api.get('/api/driver/student-list');
      return response.data;
    } catch (error) {
      console.error('Error fetching student list:', error);
      return { success: false, message: error.message };
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      const response = await api.get('/api/driver/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, message: error.message };
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/driver/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification read:', error);
      return { success: false, message: error.message };
    }
  },

  // Emergency & Messages
  sendEmergencyAlert: async (alertData) => {
    try {
      const response = await api.post('/api/driver/emergency', alertData);
      return response.data;
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      return { success: false, message: error.message };
    }
  },

  sendQuickMessage: async (messageData) => {
    try {
      const response = await api.post('/api/driver/quick-message', messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending quick message:', error);
      return { success: false, message: error.message };
    }
  },

  getQuickMessages: async () => {
    try {
      const response = await api.get('/api/driver/quick-messages');
      return response.data;
    } catch (error) {
      console.error('Error fetching quick messages:', error);
      return { success: false, message: error.message };
    }
  },

  // Profile & Settings
  getDriverProfile: async () => {
    try {
      const response = await api.get('/api/driver/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      return { success: false, message: error.message };
    }
  },

  getDriverSettings: async () => {
    try {
      const response = await api.get('/api/driver/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching driver settings:', error);
      return { success: false, message: error.message };
    }
  },

  updateDriverSettings: async (settings) => {
    try {
      const response = await api.put('/api/driver/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating driver settings:', error);
      return { success: false, message: error.message };
    }
  },

  // Bus Details
  getBusDetails: async () => {
    try {
      const response = await api.get('/api/driver/bus-details');
      return response.data;
    } catch (error) {
      console.error('Error fetching bus details:', error);
      return { success: false, message: error.message };
    }
  },

  // ============================================================================
  // STUDENT DASHBOARD ENHANCEMENT METHODS
  // ============================================================================

  // Get enhanced bus status
  getStudentBus: async () => {
    try {
      console.log('🚌 Fetching student bus data...');
      const response = await api.get('/api/student/my-bus-location');
      console.log('📦 Bus API Response:', response.data);

      if (response.data && response.data.busNumber) {
        const busData = response.data;

        // Log the coordinates
        console.log('📍 Bus Coordinates:', {
          latitude: busData.latitude,
          longitude: busData.longitude,
          hasLocation: !!(busData.latitude && busData.longitude)
        });

        // If no location, add a default fallback (Delhi center as example)
        if (!busData.latitude || !busData.longitude) {
          console.warn('⚠️ Bus has no location, using fallback coordinates');
          busData.latitude = 28.6139; // Delhi latitude
          busData.longitude = 77.2090; // Delhi longitude
          busData.isDefaultLocation = true; // Flag to show it's not real
        }

        return busData;
      }

      console.warn('⚠️ No bus data returned from API');
      return null;
    } catch (error) {
      console.error('❌ Error fetching bus:', error);
      console.error('Error details:', error.response?.data || error.message);
      return null;
    }
  },
  getBusStatus: async () => {
    try {
      const response = await api.get('/api/student/bus-status');
      return response.data;
    } catch (error) {
      console.error('Error fetching bus status:', error);
      return { success: false, status: null };
    }
  },

  // Get ETA to student's boarding stop
  getETAToMyStop: async () => {
    try {
      const response = await api.get('/api/student/eta-to-my-stop');
      return response.data;
    } catch (error) {
      console.error('Error fetching ETA:', error);
      return { success: false, eta: null };
    }
  },

  // Get distance to bus
  getDistanceToBus: async (studentLat, studentLng) => {
    try {
      const response = await api.get('/api/student/distance-to-bus', {
        params: { studentLat, studentLng }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching distance:', error);
      return { success: false, distance: null };
    }
  },

  // Get route info for path visualization
  getRouteInfo: async (studentLat, studentLng, busLat, busLng) => {
    try {
      const response = await api.get('/api/student/route-info', {
        params: { studentLat, studentLng, busLat, busLng }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching route info:', error);
      throw error;
    }
  },

  // Get bus's next stop
  getNextStop: async () => {
    try {
      const response = await api.get('/api/student/next-stop');
      return response.data;
    } catch (error) {
      console.error('Error fetching next stop:', error);
      return { success: false, nextStop: null };
    }
  },

  // Get student's stop details
  getMyStopDetails: async () => {
    try {
      const response = await api.get('/api/student/my-stop-details');
      return response.data;
    } catch (error) {
      console.error('Error fetching stop details:', error);
      return { success: false, stops: null };
    }
  },

  // Get daily schedule
  getDailySchedule: async () => {
    try {
      const response = await api.get('/api/student/daily-schedule');
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return { success: false, schedule: null };
    }
  },

  // Get student notifications
  getStudentNotifications: async () => {
    try {
      const response = await api.get('/api/student/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, notifications: [] };
    }
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/student/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification read:', error);
      return { success: false };
    }
  },

  // Get announcements
  getAnnouncements: async () => {
    try {
      const response = await api.get('/api/student/announcements');
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return { success: false, announcements: [] };
    }
  },

  // Get quick messages
  getQuickMessages: async () => {
    try {
      const response = await api.get('/api/student/quick-messages');
      return response.data;
    } catch (error) {
      console.error('Error fetching quick messages:', error);
      return { success: false, messages: {} };
    }
  },

  // Send quick contact message
  sendQuickMessage: async (messageId, recipientType) => {
    try {
      const response = await api.post('/api/student/contact-driver', {
        messageId,
        recipientType
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to send message' };
    }
  },

  // Report issue/feedback
  reportIssue: async (issueData) => {
    try {
      const response = await api.post('/api/student/report-issue', issueData);
      return response.data;
    } catch (error) {
      console.error('Error reporting issue:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit feedback'
      };
    }
  },

  // Get feedback history
  getFeedbackHistory: async () => {
    try {
      const response = await api.get('/api/student/feedback-history');
      return response.data;
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      return { success: false, feedback: [] };
    }
  },

  // Get student settings
  getStudentSettings: async () => {
    try {
      const response = await api.get('/api/student/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, settings: null };
    }
  },

  // Update student settings
  updateStudentSettings: async (settings) => {
    try {
      const response = await api.put('/api/student/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update settings'
      };
    }
  },

  // Get student profile
  getMyProfile: async () => {
    try {
      const response = await api.get('/api/student/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { success: false, profile: null };
    }
  },

  // Get student route stops (Assigned Route)
  getMyRouteStops: async () => {
    try {
      const response = await api.get('/api/student/route-stops');
      return response.data;
    } catch (error) {
      console.error('Error fetching route stops:', error);
      return { success: false, stops: [], routePath: [] };
    }
  }
};