// client/src/components/Student/NotificationsSheetContent.jsx
import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

const NotificationsSheetContent = ({ notifications = [] }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-xl font-bold text-black">Notifications</h2>
                <p className="text-xs text-gray-500 mt-1">{notifications.length} total</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <BellIcon className="w-16 h-16 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No notifications yet</p>
                        <p className="text-xs mt-1">You'll see updates here</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif.id || Math.random()} className={`p-4 rounded-xl border transition-all ${notif.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-sm ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</h3>
                                <span className="text-xs text-gray-400">{new Date(notif.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notif.message}</p>

                            {/* Attachment Display */}
                            {notif.attachment_url && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <a
                                        href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${notif.attachment_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition-colors border border-gray-300"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        {notif.attachment_name || 'View Attachment'}
                                        {notif.attachment_size && <span className="text-gray-400 ml-1">({(notif.attachment_size / 1024).toFixed(0)} KB)</span>}
                                    </a>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsSheetContent;
