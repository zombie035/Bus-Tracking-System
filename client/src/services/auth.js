// client/src/services/auth.js
import api from './api';

export const authService = {
  // Updated to accept identifier (email or phone)
  login: async (identifier, password) => {
    const response = await api.post('/api/auth/login', { identifier, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  checkAuth: async () => {
    const response = await api.get('/api/auth/check');
    return response.data;
  },

  createTestAccounts: async () => {
    const response = await api.post('/api/auth/create-test-accounts');
    return response.data;
  }
};