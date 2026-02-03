// client/src/pages/HomePage.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { user } = useAuth();

  // Redirect based on role
  if (!user) {
    return <Navigate to="/login" />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" />;
    case 'driver':
      return <Navigate to="/driver/dashboard" />;
    case 'student':
      return <Navigate to="/student/dashboard" />;
    default:
      return <Navigate to="/login" />;
  }
}

export default HomePage;