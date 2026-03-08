// client/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { DriverProvider } from './contexts/DriverContext';
// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SimpleLandingPage = React.lazy(() => import('./pages/SimpleLandingPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const AdminPages = React.lazy(() => import('./pages/AdminPages'));
const DriverDashboard = React.lazy(() => import('./pages/Driver/DriverDashboardNew'));
const StudentLayout = React.lazy(() => import('./components/Layout/StudentLayout'));
const StudentHome = React.lazy(() => import('./pages/Student/Home'));
const RouteStopsPage = React.lazy(() => import('./pages/Student/RouteStopsPage'));
const TripHistoryPage = React.lazy(() => import('./pages/Student/TripHistoryPage'));
const NotificationsPage = React.lazy(() => import('./pages/Student/NotificationsPage'));
const ProfilePage = React.lazy(() => import('./pages/Student/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/Student/SettingsPage'));
const HelpPage = React.lazy(() => import('./pages/Student/HelpPage'));

// Import PrivateRoute (Essential for auth)
import PrivateRoute from './components/Auth/PrivateRoute';

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-black text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SimpleLandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/student-login" element={<LoginPage />} />
            <Route path="/driver-login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
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
                <DriverProvider>
                  <DriverDashboard />
                </DriverProvider>
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
        </React.Suspense>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
