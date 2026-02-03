import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            // Assumed API endpoint based on StudentPage logic
            const response = await busService.getStudentNotifications();
            if (response.success) {
                setNotifications(response.notifications);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Notifications</h1>

            {loading ? (
                <div className="text-center text-slate-500 py-10">Loading notifications...</div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
                    <i className="fas fa-bell-slash text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No new notifications</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <div key={notif.id || Math.random()} className={`p-4 rounded-xl border ${notif.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    <i className={`fas fa-${notif.type === 'alert' ? 'exclamation-triangle' : 'info-circle'}`}></i>
                                </div>
                                <div>
                                    <p className="text-gray-900 font-medium">{notif.message}</p>
                                    <p className="text-sm text-gray-500 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
