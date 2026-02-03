// client/src/components/Student/AnnouncementsPanel.jsx
import React from 'react';

const AnnouncementsPanel = ({ isOpen, announcements, onClose }) => {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'normal':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'route_change':
                return 'fa-route';
            case 'holiday':
                return 'fa-calendar-times';
            case 'maintenance':
                return 'fa-tools';
            case 'emergency':
                return 'fa-exclamation-triangle';
            default:
                return 'fa-bullhorn';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-bullhorn text-blue-600"></i>
                        Announcements
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <i className="fas fa-times text-gray-600"></i>
                    </button>
                </div>

                {/* Announcements List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {announcements && announcements.length > 0 ? (
                        <div className="space-y-4">
                            {announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    {/* Header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                            <i className={`fas ${getTypeIcon(announcement.type)}`}></i>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(announcement.createdAt).toLocaleDateString()} at{' '}
                                                {new Date(announcement.createdAt).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                                                announcement.priority
                                            )}`}
                                        >
                                            {announcement.priority}
                                        </span>
                                    </div>

                                    {/* Message */}
                                    <p className="text-gray-700 leading-relaxed">{announcement.message}</p>

                                    {/* Route Info */}
                                    {announcement.routeName && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <span className="text-xs text-gray-600">
                                                <i className="fas fa-map-marked-alt mr-1"></i>
                                                Route: {announcement.routeName}
                                            </span>
                                        </div>
                                    )}

                                    {/* Expiry */}
                                    {announcement.expiresAt && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <i className="fas fa-inbox text-4xl mb-3"></i>
                            <p className="text-lg font-medium">No announcements</p>
                            <p className="text-sm mt-1">Check back later for updates</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsPanel;
