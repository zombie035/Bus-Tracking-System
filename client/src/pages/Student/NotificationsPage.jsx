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

    const handleMarkAsRead = async (id, isRead) => {
        if (isRead) return;

        try {
            await busService.markNotificationRead(id);
            // Update local state to reflect change
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking as read:', error);
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
                        <div
                            key={notif.id || Math.random()}
                            onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
                            className={`p-4 rounded-xl border cursor-pointer transition-colors ${notif.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-100 hover:bg-blue-100'}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.notification_type === 'alert' || notif.notification_type === 'warning' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    <i className={`fas fa-${notif.notification_type === 'alert' || notif.notification_type === 'warning' ? 'exclamation-triangle' : 'info-circle'}`}></i>
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-900 font-bold text-sm mb-1">{notif.title}</p>
                                    <p className="text-gray-800 font-medium">{notif.message}</p>

                                    {/* Attachment Display */}
                                    {notif.attachment_url && (
                                        <div className="mt-3">
                                            <a
                                                href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${notif.attachment_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors border border-gray-200"
                                                onClick={(e) => e.stopPropagation()} // Prevent triggering mark-as-read
                                            >
                                                <i className="fas fa-paperclip"></i>
                                                {notif.attachment_name || 'View Attachment'}
                                                {notif.attachment_size && <span className="text-gray-400 ml-1">({(notif.attachment_size / 1024).toFixed(0)} KB)</span>}
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-xs text-gray-500">
                                            {notif.sender_name && <span className="mr-2 text-gray-400">From: {notif.sender_name}</span>}
                                            {new Date(notif.created_at).toLocaleString()}
                                        </p>
                                        {!notif.is_read && (
                                            <span className="text-xs text-blue-600 font-medium">Click to mark read</span>
                                        )}
                                    </div>
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
