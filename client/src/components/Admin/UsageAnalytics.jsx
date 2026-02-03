// client/src/components/Admin/UsageAnalytics.jsx
import React, { useState, useEffect } from 'react';
import {
    UserGroupIcon,
    TruckIcon,
    ClockIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import DateRangeFilter from './DateRangeFilter';
import ChartComponent from '../UI/ChartComponent';

const UsageAnalytics = () => {
    const [usageData, setUsageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchUsageAnalytics();
    }, [startDate, endDate]);

    const fetchUsageAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/api/admin/analytics/usage', { params });

            if (response.data.success) {
                setUsageData(response.data);
            }
        } catch (err) {
            console.error('Error fetching usage analytics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (start, end) => {
        setStartDate(start);
        setEndDate(end);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading usage analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Analytics</h3>
                <p className="text-red-700">{error}</p>
                <button
                    onClick={fetchUsageAnalytics}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const { activeUsers = {}, busActivity = {}, systemHealth = {} } = usageData || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ChartBarIcon className="w-7 h-7 text-blue-600" />
                            Usage Analytics
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">System usage and performance metrics</p>
                    </div>
                    <button
                        onClick={fetchUsageAnalytics}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all"
                    >
                        <i className="fas fa-sync-alt mr-2"></i>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Date Filter */}
            <DateRangeFilter onDateChange={handleDateChange} />

            {/* Active Users Stats */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UserGroupIcon className="w-6 h-6 text-blue-600" />
                    Active Users
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Daily Active</p>
                                <p className="text-4xl font-bold mt-2">{activeUsers.daily || 0}</p>
                                <p className="text-blue-100 text-xs mt-1">Last 24 hours</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <ArrowTrendingUpIcon className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">Weekly Active</p>
                                <p className="text-4xl font-bold mt-2">{activeUsers.weekly || 0}</p>
                                <p className="text-purple-100 text-xs mt-1">Last 7 days</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <UserGroupIcon className="w-8 h-8" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium uppercase tracking-wide">Monthly Active</p>
                                <p className="text-4xl font-bold mt-2">{activeUsers.monthly || 0}</p>
                                <p className="text-green-100 text-xs mt-1">Last 30 days</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <ClockIcon className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bus Activity */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TruckIcon className="w-6 h-6 text-blue-600" />
                    Bus Activity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Buses</p>
                                <p className="text-3xl font-bold text-blue-600 mt-2">{busActivity.activeBuses || 0}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <TruckIcon className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Trips Completed</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">{busActivity.tripsCompleted || 0}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg Trip Duration</p>
                                <p className="text-3xl font-bold text-purple-600 mt-2">{busActivity.avgTripDuration || 0}<span className="text-lg">min</span></p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <ClockIcon className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Driver Login Rate</span>
                            <span className="text-sm font-bold text-blue-600">{systemHealth.driverLoginRate || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${systemHealth.driverLoginRate || 0}%` }}
                            ></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Student Check-ins</span>
                            <span className="text-sm font-bold text-green-600">{systemHealth.studentCheckIns || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: '85%' }}
                            ></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">System Uptime</span>
                            <span className="text-sm font-bold text-purple-600">{systemHealth.uptime || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${systemHealth.uptime || 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsageAnalytics;
