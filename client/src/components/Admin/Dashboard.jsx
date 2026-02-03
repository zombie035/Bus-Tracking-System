// client/src/components/Admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { busService } from '../../services/busService';
import api from '../../services/api';
import {
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  TruckIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/20/solid';
import StatCard from '../UI/StatCard';
import ChartComponent from '../UI/ChartComponent';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalDrivers: 0,
    totalAdmins: 0,
    totalBuses: 0,
    activeBuses: 0,
    delayedBuses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch real data from backend
      const response = await api.get('/api/admin/dashboard');

      if (response.data.success) {
        const { stats } = response.data;
        setStats({
          totalUsers: stats.totalUsers || 0,
          totalStudents: stats.totalStudents || 0,
          totalDrivers: stats.totalDrivers || 0,
          totalAdmins: stats.totalAdmins || 0,
          totalBuses: stats.totalBuses || 0,
          activeBuses: stats.activeBuses || 0,
          delayedBuses: stats.inactiveBuses || 0
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set zero values on error
      setStats({
        totalUsers: 0,
        totalStudents: 0,
        totalDrivers: 0,
        totalAdmins: 0,
        totalBuses: 0,
        activeBuses: 0,
        delayedBuses: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== CHART CONFIGURATIONS WITH REAL DATA ==========

  // 1. User Distribution Pie Chart
  const userDistributionData = {
    labels: ['Students', 'Drivers', 'Admins'],
    datasets: [{
      data: [stats.totalStudents, stats.totalDrivers, stats.totalAdmins],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',  // Blue for Students
        'rgba(16, 185, 129, 0.8)',  // Green for Drivers
        'rgba(139, 92, 246, 0.8)',  // Purple for Admins
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(139, 92, 246)',
      ],
      borderWidth: 2,
    }]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  // 2. Bus Status Bar Chart
  const busStatusData = {
    labels: ['Active Buses', 'Inactive Buses'],
    datasets: [{
      label: 'Bus Count',
      data: [stats.activeBuses, stats.delayedBuses],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',  // Green for Active
        'rgba(245, 158, 11, 0.8)',  // Orange for Inactive
      ],
      borderColor: [
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
      ],
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Count: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          borderDash: [2],
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    }
  };

  // 3. User Roles Horizontal Bar Chart
  const userRolesData = {
    labels: ['Students', 'Drivers', 'Admins'],
    datasets: [{
      label: 'User Count',
      data: [stats.totalStudents, stats.totalDrivers, stats.totalAdmins],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(139, 92, 246)',
      ],
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  const horizontalBarOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Count: ${context.parsed.x}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          borderDash: [2],
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    }
  };


  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-gray-600">Welcome back! Here's your system overview for today.</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200 shadow-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Active
            </span>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hover:shadow"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid - 4 Columns on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={UserGroupIcon}
          color="blue"
          trend="+12%"
          trendUp={true}
          loading={loading}
        />
        <StatCard
          title="Students"
          value={stats.totalStudents}
          icon={AcademicCapIcon}
          color="green"
          trend="+8%"
          trendUp={true}
          loading={loading}
        />
        <StatCard
          title="Drivers"
          value={stats.totalDrivers}
          icon={UserIcon}
          color="purple"
          trend="+5%"
          trendUp={true}
          loading={loading}
        />
        <StatCard
          title="Total Buses"
          value={stats.totalBuses}
          icon={TruckIcon}
          color="amber"
          trend="+15%"
          trendUp={true}
          loading={loading}
        />
      </div>

      {/* Secondary Stats Grid - 3 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Buses Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Active Buses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeBuses}</p>
              <div className="flex items-center gap-2 mt-4">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">All systems operational</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-100 flex-shrink-0">
              <TruckIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Delayed Buses Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Delayed Buses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.delayedBuses}</p>
              <div className="flex items-center gap-2 mt-4">
                <ArrowTrendingDownIcon className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">Needs attention</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-100 flex-shrink-0">
              <ClockIcon className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* System Admins Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">System Admins</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAdmins}</p>
              <p className="text-sm font-medium text-gray-600 mt-4">Managing system operations</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 flex-shrink-0">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Visualization Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* 1. User Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">User Distribution</h2>
            <p className="text-sm text-gray-600 mt-1">Breakdown by role</p>
          </div>
          <div className="h-80">
            <ChartComponent data={userDistributionData} options={pieChartOptions} type="pie" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Users:</span>
              <span className="font-bold text-gray-900">{stats.totalUsers}</span>
            </div>
          </div>
        </div>

        {/* 2. Bus Status Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Bus Activity Status</h2>
            <p className="text-sm text-gray-600 mt-1">Active vs Inactive buses</p>
          </div>
          <div className="h-80">
            <ChartComponent data={busStatusData} options={barChartOptions} type="bar" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Total Buses:</span>
              <span className="font-bold text-gray-900">{stats.totalBuses}</span>
            </div>
          </div>
        </div>

        {/* 3. User Roles Horizontal Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2 xl:col-span-1">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">User Roles Comparison</h2>
            <p className="text-sm text-gray-600 mt-1">Count by user type</p>
          </div>
          <div className="h-80">
            <ChartComponent data={userRolesData} options={horizontalBarOptions} type="bar" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-600">Students</p>
              <p className="text-lg font-bold text-blue-600">{stats.totalStudents}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Drivers</p>
              <p className="text-lg font-bold text-green-600">{stats.totalDrivers}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Admins</p>
              <p className="text-lg font-bold text-purple-600">{stats.totalAdmins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-5">
            {[
              { text: 'New student registration', time: '2 min ago', icon: 'user-plus', color: 'green' },
              { text: 'Bus #12 location updated', time: '5 min ago', icon: 'map-marker-alt', color: 'blue' },
              { text: 'Driver assigned to Bus #08', time: '10 min ago', icon: 'user-check', color: 'purple' },
              { text: 'Route #5 modified', time: '15 min ago', icon: 'route', color: 'orange' },
              { text: 'System backup completed', time: '1 hour ago', icon: 'check-circle', color: 'green' },
            ].map((activity, index) => (
              <div key={index} className="flex gap-4">
                <div className={`p-2 rounded-lg bg-${activity.color}-100 flex-shrink-0`}>
                  <i className={`fas fa-${activity.icon} text-${activity.color}-600 text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">System Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <i className="fas fa-users text-blue-600"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Students</p>
                  <p className="text-xs text-gray-500">Active users</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <i className="fas fa-user-tie text-green-600"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Active Drivers</p>
                  <p className="text-xs text-gray-500">On duty</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.totalDrivers}</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <i className="fas fa-bus text-amber-600"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Active Buses</p>
                  <p className="text-xs text-gray-500">Currently running</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.activeBuses}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;