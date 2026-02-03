// client/src/components/Common/NotificationToast.jsx
import React, { useEffect } from 'react';

const NotificationToast = ({ message, type = 'info', duration = 5000, onClose }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const types = {
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'fa-info-circle',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-900'
        },
        success: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            icon: 'fa-check-circle',
            iconColor: 'text-green-600',
            textColor: 'text-green-900'
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: 'fa-exclamation-triangle',
            iconColor: 'text-yellow-600',
            textColor: 'text-yellow-900'
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: 'fa-exclamation-circle',
            iconColor: 'text-red-600',
            textColor: 'text-red-900'
        }
    };

    const config = types[type] || types.info;

    return (
        <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
            <div className={`${config.bg} ${config.border} border rounded-lg shadow-lg p-4 max-w-md min-w-[300px]`}>
                <div className="flex items-start gap-3">
                    <i className={`fas ${config.icon} ${config.iconColor} mt-0.5`}></i>
                    <div className="flex-1">
                        <p className={`${config.textColor} font-medium`}>{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer ml-2 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200"
                        aria-label="Close notification"
                        type="button"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationToast;
