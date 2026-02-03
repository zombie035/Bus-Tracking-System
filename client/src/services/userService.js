// client/src/services/userService.js
import api from './api';

export const userService = {
  // Missing method - add this
  // userService.js - Update the getAllUsers method
getAllUsers: async () => {
  try {
    const response = await api.get('/api/admin/users');
    // Handle both response structures
    if (Array.isArray(response.data)) {
      return { success: true, users: response.data };
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, users: [] };
  }
},

  // Remove the duplicate createUser method (you have two identical ones)
  createUser: async (userData) => {
    try {
      console.log('📤 Sending user data:', userData);
      
      const response = await api.post('/api/admin/users', userData);
      console.log('✅ User created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating user:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status
      });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create user' 
      };
    }
  },

  // Note: You have TWO createUser methods - remove one of them
  // Keep only the one above (with logging) or this one (without logging)

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to update user' };
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to delete user' };
    }
  },

  resetPassword: async (userId, password) => {
    try {
      const response = await api.post('/api/admin/users/reset-password', { userId, password });
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to reset password' };
    }
  },

  // Update the bulkImportUsers method in userService.js
bulkImportUsers: async (usersData) => {
  try {
    console.log('📤 Bulk importing users:', usersData);
    const response = await api.post('/api/admin/users/bulk-import', usersData);
    console.log('✅ Bulk import response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error bulk importing users:', {
      error: error,
      response: error.response?.data,
      status: error.response?.status
    });
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to import users',
      results: [],
      errors: []
    };
  }
},

  getAvailableDrivers: async () => {
    try {
      const response = await api.get('/api/admin/drivers');
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return { success: false, drivers: [] };
    }
  },

  getAvailableBuses: async () => {
    try {
      const response = await api.get('/api/admin/buses');
      return response.data;
    } catch (error) {
      console.error('Error fetching buses:', error);
      return { success: false, buses: [] };
    }
  },

  getStudentProfile: async () => {
    try {
      const response = await api.get('/api/students/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching student profile:', error);
      return { success: false };
    }
  },

  // Utility functions for parsing
  parseCSV: (csvText) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      return lines.slice(1).map((line, index) => {
        const values = line.split(',');
        const user = { id: index + 1, status: 'pending' };
        headers.forEach((header, i) => {
          if (values[i]) {
            user[header] = values[i].trim();
          }
        });
        return user;
      });
    } catch (error) {
      console.error('CSV parsing error:', error);
      return [];
    }
  },

  parseJSON: (jsonText) => {
    try {
      const data = JSON.parse(jsonText);
      return Array.isArray(data) ? data.map((item, index) => ({
        id: index + 1,
        ...item,
        status: 'pending'
      })) : [];
    } catch (error) {
      console.error('JSON parsing error:', error);
      return [];
    }
  },

  parseClipboard: (text) => {
    try {
      // Try CSV first
      if (text.includes(',')) {
        return userService.parseCSV(text);
      }
      
      // Try JSON
      if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        return userService.parseJSON(text);
      }
      
      // Try tab-separated
      const lines = text.split('\n').filter(line => line.trim());
      return lines.map((line, index) => {
        const values = line.split('\t');
        return {
          id: index + 1,
          name: values[0] || '',
          email: values[1] || '',
          role: values[2] || 'student',
          phone: values[3] || '',
          address: values[4] || '',
          status: 'pending'
        };
      });
    } catch (error) {
      console.error('Clipboard parsing error:', error);
      return [];
    }
  }
};