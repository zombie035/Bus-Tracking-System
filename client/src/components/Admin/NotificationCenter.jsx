// client/src/components/Admin/NotificationCenter.jsx
import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/20/solid';
import api from '../../services/api';
import io from 'socket.io-client';

const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        // Fetch initial notifications
        fetchNotifications();

        // Setup WebSocket for real-time notifications
        const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🔔 Connected to notification service');
            // Register for notifications with user ID from session
            const userId = sessionStorage.getItem('userId');
            if (userId) {
                socket.emit('register-notifications', userId);
            }
        });

        socket.on('notification-ready', (data) => {
            console.log('✅ Notification service ready:', data);
        });

        socket.on('notification', (notification) => {
            console.log('📨 New notification received:', notification);
            // Add new notification to the list
            setNotifications(prev => [notification.data, ...prev]);
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from notification service');
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/notifications');
            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsRead = async (id) => {
        try {
            const response = await api.put(`/api/notifications/${id}/read`);
            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === id ? { ...notif, is_read: true } : notif
                    )
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await api.put('/api/notifications/read-all');
            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, is_read: true }))
                );
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const clearNotification = async (id) => {
        try {
            const response = await api.delete(`/api/notifications/${id}`);
            if (response.data.success) {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'warning':
                return '⚠';
            case 'error':
            case 'alert':
                return '✕';
            default:
                return 'ℹ';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-100 text-green-600 border-green-200';
            case 'warning':
                return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'error':
            case 'alert':
                return 'bg-red-100 text-red-600 border-red-200';
            default:
                return 'bg-blue-100 text-blue-600 border-blue-200';
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <BellIcon className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Notification Panel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-gray-200 rounded"
                                    >
                                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No notifications</p>
                                    <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${getTypeColor(notification.notification_type)}`}>
                                                    <span className="text-lg font-bold">{getIcon(notification.notification_type)}</span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="text-sm font-semibold text-gray-900">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="flex-shrink-0 p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                                title="Mark as read"
                                                            >
                                                                <CheckIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-gray-500">{formatTime(notification.created_at)}</span>
                                                        <button
                                                            onClick={() => clearNotification(notification.id)}
                                                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-200 bg-gray-50">
                                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    View All Notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;
