// client/src/components/Driver/NotificationsPanel.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const NotificationsPanel = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await busService.getNotifications();
            if (response.success) {
                setNotifications(response.notifications || []);
                setUnreadCount(response.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await busService.markNotificationRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            warning: { icon: 'fa-exclamation-triangle', color: 'text-orange-600', bg: 'bg-orange-100' },
            alert: { icon: 'fa-exclamation-circle', color: 'text-red-600', bg: 'bg-red-100' },
            route_change: { icon: 'fa-route', color: 'text-blue-600', bg: 'bg-blue-100' },
            info: { icon: 'fa-info-circle', color: 'text-blue-600', bg: 'bg-blue-100' }
        };
        return icons[type] || icons.info;
    };

    const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow">
                        <i className="fas fa-bell"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <p className="text-xs text-gray-600">{unreadCount} unread</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                    <button
                        onClick={fetchNotifications}
                        className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-purple-600 hover:text-purple-700 transition-colors"
                        title="Refresh"
                    >
                        <i className="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <i className="fas fa-inbox text-gray-300 text-2xl"></i>
                        </div>
                        <p className="text-gray-600 font-medium">No notifications</p>
                        <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    <>
                        {displayNotifications.map((notif) => {
                            const typeStyle = getTypeIcon(notif.notificationType);
                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        {/* Icon */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${typeStyle.bg} flex items-center justify-center`}>
                                            <i className={`fas ${typeStyle.icon} ${typeStyle.color}`}></i>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900 line-clamp-1">{notif.title}</h4>
                                                {!notif.isRead && (
                                                    <div className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-1.5"></div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{notif.message}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <i className="fas fa-clock"></i>
                                                    {new Date(notif.createdAt).toLocaleString('en-IN', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                                {!notif.isRead && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Show More/Less Button */}
                        {notifications.length > 5 && (
                            <div className="p-3 border-t border-gray-200">
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                                >
                                    {showAll ? (
                                        <>
                                            <i className="fas fa-chevron-up mr-2"></i>
                                            Show Less
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-chevron-down mr-2"></i>
                                            Show All ({notifications.length})
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;
