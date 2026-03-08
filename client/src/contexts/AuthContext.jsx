// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/auth/check');
      if (response.data.authenticated) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login with identifier:', identifier);
      
      const response = await api.post('/api/auth/login', {
        identifier, // Can be email or phone number
        password
      });

      console.log('🔍 Server response:', response.data);

      if (response.data.success) {
        setUser(response.data.user);
        setError(null);
        return {
          success: true,
          role: response.data.user.role
        };
      }
      
      setError(response.data.message || 'Login failed');
      return { success: false, message: response.data.message };
    } catch (err) {
      console.error('❌ Login error:', err);

      let message = 'Login failed';
      if (err.code === 'ERR_NETWORK') {
        message = 'Network Error: Cannot connect to server. Check IP and Port.';
      } else if (err.response?.status === 401) {
        message = 'Invalid credentials. Please try again.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.error) {
        message = err.error;
      }

      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {}, {
        withCredentials: true
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDriver: user?.role === 'driver',
    isStudent: user?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};