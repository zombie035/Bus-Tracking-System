// client/src/pages/AdminPages.jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Dashboard from '../components/Admin/Dashboard';
import UserManagement from '../components/Admin/UserManagement';
import BusManagement from '../components/Admin/BusManagement';
import RouteManagement from '../components/Admin/RouteManagement';
import LiveMonitor from '../components/Admin/LiveMonitor';
import RouteAnalytics from '../components/Admin/RouteAnalytics';
import UsageAnalytics from '../components/Admin/UsageAnalytics';
import DriverStatusPanel from '../components/Admin/DriverStatusPanel';
import NotificationManagement from '../components/Admin/NotificationManagement';
import '../styles/admin.css';

function AdminPages() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside
          className={`fixed top - 16 bottom - 0 left - 0 z - 30 bg - white border - r border - gray - 200 transition - transform duration - 300 ease -in -out overflow - y - auto ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
            } `}
        >
          <div className="p-6 h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="mb-8 px-2">
              <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
              <p className="text-xs text-gray-500 mt-1">Management Dashboard</p>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-1">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group text-sm"
              >
                <i className="fas fa-chart-bar text-gray-400 group-hover:text-blue-600 w-5 text-center"></i>
                <span className="font-medium">Dashboard</span>
              </Link>

              <Link
                to="/admin/users"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group text-sm"
              >
                <i className="fas fa-users text-gray-400 group-hover:text-blue-600 w-5 text-center"></i>
                <span className="font-medium">User Management</span>
              </Link>

              <Link
                to="/admin/buses"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group text-sm"
              >
                <i className="fas fa-bus text-gray-400 group-hover:text-blue-600 w-5 text-center"></i>
                <span className="font-medium">Bus Management</span>
              </Link>

              <Link
                to="/admin/routes"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group text-sm"
              >
                <i className="fas fa-route text-gray-400 group-hover:text-blue-600 w-5 text-center"></i>
                <span className="font-medium">Routes</span>
              </Link>

              <Link
                to="/admin/monitor"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group text-sm"
              >
                <i className="fas fa-map-marker-alt text-gray-400 group-hover:text-blue-600 w-5 text-center"></i>
                <span className="font-medium">Live Monitor</span>
              </Link>

              <Link
                to="/admin/analytics"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group text-sm"
              >
                <i className="fas fa-chart-line text-gray-400 group-hover:text-blue-600 w-5 text-center"></i>
                <span className="font-medium">Route Analytics</span>
              </Link>

              <Link
                to="/admin/usage"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group text-sm"
              >
                <i className="fas fa-chart-bar text-gray-400 group-hover:text-blue-600 w-5 text-center"></i>
                <span className="font-medium">Usage Analytics</span>
              </Link>

              <Link
                to="/admin/drivers"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group text-sm"
              >
                <i className="fas fa-user-tie text-gray-400 group-hover:text-blue-600 w-5 text-center"></i>
                <span className="font-medium">Driver Status</span>
              </Link>

              <Link
                to="/admin/notifications"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group text-sm"
              >
                <i className="fas fa-bell text-gray-400 group-hover:text-blue-600 w-5 text-center"></i>
                <span className="font-medium">Notifications</span>
              </Link>
            </nav>

            {/* Bottom Section */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm"
              >
                <i className="fas fa-arrow-left text-gray-400 w-5 text-center"></i>
                <span className="font-medium">Back to Home</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-64' : ''} w-full`}>
          {/* Burger Menu Button for Mobile */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-16 z-20">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-sm"
            >
              <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'} text - gray - 700`}></i>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="buses" element={<BusManagement />} />
              <Route path="routes" element={<RouteManagement />} />
              <Route path="monitor" element={<LiveMonitor />} />
              <Route path="analytics" element={<RouteAnalytics />} />
              <Route path="usage" element={<UsageAnalytics />} />
              <Route path="drivers" element={<DriverStatusPanel />} />
              <Route path="notifications" element={<NotificationManagement />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" />} />
            </Routes>
          </div>
        </main>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden backdrop-blur-sm"
            onClick={toggleSidebar}
            style={{ top: '4rem' }}
          ></div>
        )}
      </div>
    </div>
  );
}

export default AdminPages;