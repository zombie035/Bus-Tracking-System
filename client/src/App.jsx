// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AdminPages from './pages/AdminPages';
import DriverDashboard from './pages/DriverPage';
import StudentLayout from './components/Layout/StudentLayout';
import StudentHome from './pages/Student/Home';
import RouteStopsPage from './pages/Student/RouteStopsPage';
import TripHistoryPage from './pages/Student/TripHistoryPage';
import NotificationsPage from './pages/Student/NotificationsPage';
import ProfilePage from './pages/Student/ProfilePage';
import SettingsPage from './pages/Student/SettingsPage';
import HelpPage from './pages/Student/HelpPage';
import PrivateRoute from './components/Auth/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          } />

          <Route path="/admin/*" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminPages />
            </PrivateRoute>
          } />

          <Route path="/driver/*" element={
            <PrivateRoute allowedRoles={['driver']}>
              <DriverDashboard />
            </PrivateRoute>
          } />

          <Route path="/student" element={
            <PrivateRoute allowedRoles={['student']}>
              <StudentLayout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentHome />} />
            <Route path="route" element={<RouteStopsPage />} />
            <Route path="history" element={<TripHistoryPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;