import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
const DriverBottomNav = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const tabs = [
    { id: 'map', icon: 'fa-route', label: 'Route Map' },
    { id: 'trip', icon: 'fa-th-large', label: 'Dashboard' },
    { id: 'broadcast', icon: 'fa-bullhorn', label: 'Broadcast' },
    { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics' },
    { id: 'settings', icon: 'fa-cog', label: 'Settings' }
  ];

  return (
    <div className="driver-bottom-nav">
      {/* User Avatar at top (from image) */}
      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.name?.substring(0, 2).toUpperCase() || 'JD'}
          <div className="presence-dot"></div>
        </div>
      </div>

      <div className="nav-items">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            title={tab.label}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Logout at bottom (from image) */}
      <div className="sidebar-footer">
        <button className="nav-item" onClick={logout} title="Logout">
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>
  );
};


export default DriverBottomNav;
