// client/src/components/Admin/DriverStatusPanel.jsx
import React, { useState, useEffect } from 'react';
import {
    UserIcon,
    PhoneIcon,
    TruckIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const DriverStatusPanel = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, online, offline

    useEffect(() => {
        fetchDriverStatus();
        // Refresh every 30 seconds
        const interval = setInterval(fetchDriverStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDriverStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/drivers/status');
            if (response.data.success) {
                setDrivers(response.data.drivers || []);
            }
        } catch (err) {
            console.error('Error fetching driver status:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'online') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-4 h-4" />
                    Online
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                <XCircleIcon className="w-4 h-4" />
                Offline
            </span>
        );
    };

    const getTimeSince = (timestamp) => {
        if (!timestamp) return 'Never';
        const now = new Date();
        const lastActive = new Date(timestamp);
        const diffMs = now - lastActive;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const filteredDrivers = drivers.filter(driver => {
        if (filter === 'all') return true;
        return driver.status === filter;
    });

    const onlineCount = drivers.filter(d => d.status === 'online').length;
    const offlineCount = drivers.filter(d => d.status === 'offline').length;

    if (loading && drivers.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-2 text-gray-600">Loading drivers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <UserIcon className="w-7 h-7 text-blue-600" />
                            Driver Status
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Real-time driver availability</p>
                    </div>
                    <button
                        onClick={fetchDriverStatus}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all"
                    >
                        <i className="fas fa-sync-alt mr-2"></i>
                        Refresh
                    </button>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">Total Drivers</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{drivers.length}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-700 font-medium">Online</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">{onlineCount}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 font-medium">Offline</p>
                        <p className="text-3xl font-bold text-gray-500 mt-1">{offlineCount}</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${filter === 'all'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    All ({drivers.length})
                </button>
                <button
                    onClick={() => setFilter('online')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${filter === 'online'
                            ? 'border-b-2 border-green-600 text-green-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Online ({onlineCount})
                </button>
                <button
                    onClick={() => setFilter('offline')}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${filter === 'offline'
                            ? 'border-b-2 border-gray-600 text-gray-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Offline ({offlineCount})
                </button>
            </div>

            {/* Driver List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredDrivers.length === 0 ? (
                    <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-gray-200">
                        <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No drivers found</p>
                    </div>
                ) : (
                    filteredDrivers.map(driver => (
                        <div
                            key={driver.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            {/* Driver Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                        {driver.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{driver.name || 'Unknown Driver'}</h3>
                                        <p className="text-sm text-gray-500">{driver.email || 'No email'}</p>
                                    </div>
                                </div>
                                {getStatusBadge(driver.status)}
                            </div>

                            {/* Driver Info */}
                            <div className="space-y-3">
                                {/* Phone */}
                                {driver.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">{driver.phone}</span>
                                        <a
                                            href={`tel:${driver.phone}`}
                                            className="ml-auto text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Call
                                        </a>
                                    </div>
                                )}

                                {/* Current Bus */}
                                {driver.currentBus ? (
                                    <div className="flex items-center gap-2 text-sm">
                                        <TruckIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-700">
                                            Bus {driver.currentBus.busNumber} • {driver.currentBus.routeName}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <TruckIcon className="w-4 h-4 text-gray-400" />
                                        <span>No bus assigned</span>
                                    </div>
                                )}

                                {/* Last Active */}
                                <div className="flex items-center gap-2 text-sm">
                                    <ClockIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700">
                                        Last active: {getTimeSince(driver.lastActive)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DriverStatusPanel;
