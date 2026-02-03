// client/src/components/Admin/NotificationManagement.jsx
import React, { useState, useEffect } from 'react';
import {
    PaperAirplaneIcon,
    BellAlertIcon,
    ClockIcon,
    UserGroupIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const NotificationManagement = () => {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        read: 0,
        unread: 0
    });

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        recipientType: 'all', // all, student, driver
        notificationType: 'info', // info, warning, alert, success
        expiresIn: 24 // hours
    });

    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchHistory();
        fetchStats();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/api/admin/notifications/history');
            if (response.data.success) {
                setHistory(response.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/notifications/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Calculate expiration date
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + parseInt(formData.expiresIn));

            const payload = {
                ...formData,
                expiresAt: expiresAt.toISOString()
            };

            const response = await api.post('/api/admin/notifications/broadcast', payload);

            if (response.data.success) {
                setToast({ type: 'success', message: 'Notification broadcasted successfully!' });
                setFormData({
                    title: '',
                    message: '',
                    recipientType: 'all',
                    notificationType: 'info',
                    expiresIn: 24
                });
                fetchHistory(); // Refresh history
                fetchStats(); // Refresh stats
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            setToast({ type: 'error', message: 'Failed to send notification' });
        } finally {
            setLoading(false);
            // Clear toast after 3 seconds
            setTimeout(() => setToast(null), 3000);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-800';
            case 'warning': return 'bg-amber-100 text-amber-800';
            case 'alert':
            case 'error': return 'bg-red-100 text-red-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    } z-50 transition-opacity duration-300`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Notification Management</h2>
                    <p className="text-gray-600">Broadcast messages and manage system alerts</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <BellAlertIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Sent (30d)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <UserGroupIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Read Rate</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0}%
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <ClockIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Alerts</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {history.filter(n => !n.expires_at || new Date(n.expires_at) > new Date()).length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Notification Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <PaperAirplaneIcon className="w-5 h-5 text-blue-600" />
                            Send Broadcast
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., School Closed Tomorrow"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your message here..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                                    <select
                                        value={formData.recipientType}
                                        onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">Check Everyone</option>
                                        <option value="student">Students Only</option>
                                        <option value="driver">Drivers Only</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.notificationType}
                                        onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="alert">Critical Alert</option>
                                        <option value="success">Success</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                <select
                                    value={formData.expiresIn}
                                    onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="1">1 Hour</option>
                                    <option value="12">12 Hours</option>
                                    <option value="24">24 Hours</option>
                                    <option value="48">48 Hours</option>
                                    <option value="168">7 Days</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? 'Sending...' : (
                                    <>
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                        Broadcast Notification
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Recent Broadcasts</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                                    <tr>
                                        <th className="px-6 py-4">Title / Message</th>
                                        <th className="px-6 py-4">Target</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Sent At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                                                No notifications sent yet
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">{item.title}</p>
                                                    <p className="truncate max-w-xs">{item.message}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">
                                                        {item.recipient_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getTypeColor(item.notification_type)}`}>
                                                        {item.notification_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationManagement;
