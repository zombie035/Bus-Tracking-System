// client/src/components/Driver/EmergencyButton.jsx
import React, { useState } from 'react';
import useGeolocation from '../../hooks/useGeolocation';

const EmergencyButton = ({ onEmergency }) => {
    const { location } = useGeolocation();
    const [showConfirm, setShowConfirm] = useState(false);
    const [alertType, setAlertType] = useState('breakdown');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const alertTypes = [
        { value: 'breakdown', label: 'Vehicle Breakdown', icon: 'fa-car-crash', color: 'orange' },
        { value: 'accident', label: 'Accident', icon: 'fa-exclamation-triangle', color: 'red' },
        { value: 'medical', label: 'Medical Emergency', icon: 'fa-ambulance', color: 'red' },
        { value: 'other', label: 'Other Emergency', icon: 'fa-bell', color: 'yellow' }
    ];

    const handleEmergency = async () => {
        setSending(true);

        const alertData = {
            alertType,
            message: message || `Emergency: ${alertTypes.find(t => t.value === alertType)?.label}`,
            latitude: location?.latitude || null,
            longitude: location?.longitude || null
        };

        await onEmergency(alertData);
        setSending(false);
        setShowConfirm(false);
        setMessage('');
    };

    if (showConfirm) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                    <div className="p-6">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        </div>

                        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                            Send Emergency Alert?
                        </h2>
                        <p className="text-center text-gray-600 mb-6">
                            This will immediately notify the administration with your location.
                        </p>

                        {/* Alert Type Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                                Emergency Type
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {alertTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setAlertType(type.value)}
                                        className={`p-3 rounded-lg border-2 transition-all ${alertType === type.value
                                                ? `border-${type.color}-500 bg-${type.color}-50`
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <i className={`fas ${type.icon} text-lg mb-1`}></i>
                                        <div className="text-xs font-medium">{type.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message */}
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe the emergency (optional)..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
                        ></textarea>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={sending}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEmergency}
                                disabled={sending}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-bell"></i>
                                        Send Alert
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="w-full p-4 bg-gradient-to-r from-red-50 to-red-600 text-white rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg border-2 border-red-700 flex items-center justify-center gap-3 animate-pulse"
        >
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <span>EMERGENCY ALERT</span>
        </button>
    );
};

export default EmergencyButton;
