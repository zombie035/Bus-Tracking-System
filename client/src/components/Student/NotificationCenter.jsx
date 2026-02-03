// client/src/components/Student/NotificationCenter.jsx
import React from 'react';
import { busService } from '../../services/busService';

const NotificationCenter = ({ notifications, onClose, onRefresh }) => {
    const handleMarkAsRead = async (id) => {
        await busService.markNotificationRead(id);
        onRefresh?.();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'bus_started':
                return 'fa-bus text-green-600';
            case 'bus_delayed':
                return 'fa-clock text-yellow-600';
            case 'bus_approaching':
                return 'fa-map-marker-alt text-blue-600';
            case 'emergency':
                return 'fa-exclamation-triangle text-red-600';
            case 'announcement':
                return 'fa-bullhorn text-purple-600';
            default:
                return 'fa-info-circle text-gray-600';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-bell text-blue-600"></i>
                        Notifications
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={onRefresh}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <i className="fas fa-sync-alt"></i>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <i className="fas fa-times text-gray-600"></i>
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {notifications && notifications.length > 0 ? (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 rounded-lg border-2 transition-all ${notification.isRead
                                            ? 'bg-gray-50 border-gray-200'
                                            : 'bg-blue-50 border-blue-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                                                <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-1">
                                                {notification.title}
                                            </h4>
                                            <p className="text-gray-700 text-sm mb-2">{notification.message}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </span>
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {notification.priority === 'urgent' && (
                                            <div className="flex-shrink-0">
                                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                                                    URGENT
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <i className="fas fa-bell-slash text-4xl mb-3"></i>
                            <p className="text-lg font-medium">No notifications</p>
                            <p className="text-sm mt-1">You're all caught up!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
