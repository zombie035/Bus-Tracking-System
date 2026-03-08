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
  },

  // Get route stops by bus number
  getRouteStopsByBus: async (busNumber) => {
    try {
      console.log('🚌 Fetching route stops for bus:', busNumber);
      
      const response = await api.get(`/api/bus/bus/${busNumber}/stops`);
      
      console.log('📍 Route stops response:', response.data);
      
      return {
        success: true,
        stops: response.data.stops || []
      };
    } catch (error) {
      console.error('❌ Error fetching route stops:', error);
      
      // Return mock data as fallback
      const mockStops = this.getMockStopsForBus(busNumber);
      return {
        success: false,
        stops: mockStops,
        error: error.response?.data?.message || 'Failed to fetch route stops'
      };
    }
  },

  // Get mock stops as fallback
  getMockStopsForBus(busNumber) {
    const mockRoutes = {
      'BUS001': [
        { id: 1, name: 'Main Gate', lat: 9.9252, lng: 78.1198, order: 1, busNumber: 'BUS001' },
        { id: 2, name: 'Library', lat: 9.9262, lng: 78.1208, order: 2, busNumber: 'BUS001' },
        { id: 3, name: 'Cafeteria', lat: 9.9272, lng: 78.1218, order: 3, busNumber: 'BUS001' },
        { id: 4, name: 'Sports Complex', lat: 9.9282, lng: 78.1228, order: 4, busNumber: 'BUS001' },
        { id: 5, name: 'Hostel Block A', lat: 9.9292, lng: 78.1238, order: 5, busNumber: 'BUS001' }
      ],
      'BUS002': [
        { id: 6, name: 'North Gate', lat: 9.9302, lng: 78.1248, order: 1, busNumber: 'BUS002' },
        { id: 7, name: 'Science Block', lat: 9.9312, lng: 78.1258, order: 2, busNumber: 'BUS002' },
        { id: 8, name: 'Engineering Block', lat: 9.9322, lng: 78.1268, order: 3, busNumber: 'BUS002' },
        { id: 9, name: 'Medical Center', lat: 9.9332, lng: 78.1278, order: 4, busNumber: 'BUS002' },
        { id: 10, name: 'Bus Terminal', lat: 9.9342, lng: 78.1288, order: 5, busNumber: 'BUS002' }
      ],
      'BUS003': [
        { id: 11, name: 'East Gate', lat: 9.9352, lng: 78.1298, order: 1, busNumber: 'BUS003' },
        { id: 12, name: 'Arts Block', lat: 9.9362, lng: 78.1308, order: 2, busNumber: 'BUS003' },
        { id: 13, name: 'Commerce Block', lat: 9.9372, lng: 78.1318, order: 3, busNumber: 'BUS003' },
        { id: 14, name: 'Student Center', lat: 9.9382, lng: 78.1328, order: 4, busNumber: 'BUS003' },
        { id: 15, name: 'Parking Lot', lat: 9.9392, lng: 78.1338, order: 5, busNumber: 'BUS003' },
        { id: 16, name: 'Main Exit', lat: 9.9402, lng: 78.1348, order: 6, busNumber: 'BUS003' }
      ],
      '121': [
        { id: 17, name: 'College Entrance', lat: 9.9252, lng: 78.1198, order: 1, busNumber: '121' },
        { id: 18, name: 'Administration Block', lat: 9.9262, lng: 78.1208, order: 2, busNumber: '121' },
        { id: 19, name: 'Computer Science Dept', lat: 9.9272, lng: 78.1218, order: 3, busNumber: '121' },
        { id: 20, name: 'Canteen', lat: 9.9282, lng: 78.1228, order: 4, busNumber: '121' },
        { id: 21, name: 'Library', lat: 9.9292, lng: 78.1238, order: 5, busNumber: '121' },
        { id: 22, name: 'Sports Ground', lat: 9.9302, lng: 78.1248, order: 6, busNumber: '121' },
        { id: 23, name: 'Hostel Block', lat: 9.9312, lng: 78.1258, order: 7, busNumber: '121' }
      ]
    };
    
    return mockRoutes[busNumber] || mockRoutes['BUS001'];
  }
};

export default routeService;
