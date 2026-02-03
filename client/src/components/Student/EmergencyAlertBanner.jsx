// client/src/components/Student/EmergencyAlertBanner.jsx
import React from 'react';

const EmergencyAlertBanner = ({ alert, onDismiss }) => {
    if (!alert) return null;

    return (
        <div className="fixed top-20 left-0 right-0 z-50 p-4 animate-slideDown">
            <div className="max-w-4xl mx-auto bg-red-600 text-white rounded-lg shadow-2xl p-4 border-4 border-red-700">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-pulse">
                            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                            <span>EMERGENCY ALERT</span>
                            <span className="animate-pulse">🚨</span>
                        </h3>
                        <p className="text-red-100 mb-2">{alert.type || 'Emergency Situation'}</p>
                        <p className="text-white font-medium">{alert.message}</p>

                        {alert.timestamp && (
                            <p className="text-sm text-red-200 mt-2">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                            </p>
                        )}
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={onDismiss}
                        className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                    <a
                        href="tel:911"
                        className="flex-1 bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-center hover:bg-red-50 transition-colors"
                    >
                        <i className="fas fa-phone mr-2"></i>
                        Call Emergency
                    </a>
                    <button
                        onClick={onDismiss}
                        className="px-6 py-2 bg-red-700 rounded-lg font-medium hover:bg-red-800 transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmergencyAlertBanner;
