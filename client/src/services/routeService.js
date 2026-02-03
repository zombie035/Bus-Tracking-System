// client/src/services/routeService.js
import api from './api';

const routeService = {
  // Get all routes
  getRoutes: async (params = {}) => {
    try {
      const response = await api.get('/api/admin/routes', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  },

  // Get single route
  getRoute: async (id) => {
    try {
      const response = await api.get(`/api/admin/routes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching route:', error);
      throw error;
    }
  },

  // Create route
  createRoute: async (routeData) => {
    try {
      const response = await api.post('/api/admin/routes', routeData);
      return response.data;
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  },

  // Update route
  updateRoute: async (id, routeData) => {
    try {
      const response = await api.put(`/api/admin/routes/${id}`, routeData);
      return response.data;
    } catch (error) {
      console.error('Error updating route:', error);
      throw error;
    }
  },

  // Delete route
  deleteRoute: async (id) => {
    try {
      const response = await api.delete(`/api/admin/routes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  }
};

export default routeService;
