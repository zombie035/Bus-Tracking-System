// client/src/components/Driver/DelayReportModal.jsx
import React, { useState } from 'react';
import useGeolocation from '../../hooks/useGeolocation';

const DelayReportModal = ({ isOpen, onClose, onSubmit }) => {
    const { location } = useGeolocation();
    const [reason, setReason] = useState('traffic');
    const [minutes, setMinutes] = useState(15);
    const [customMessage, setCustomMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const delayReasons = [
        { value: 'traffic', label: '🚦 Heavy Traffic', icon: 'fa-traffic-light' },
        { value: 'breakdown', label: '🔧 Vehicle Breakdown', icon: 'fa-wrench' },
        { value: 'weather', label: '🌧️ Bad Weather', icon: 'fa-cloud-rain' },
        { value: 'other', label: '📝 Other Reason', icon: 'fa-exclamation-circle' }
    ];

    const handleSubmit = async () => {
        setSubmitting(true);

        const delayData = {
            reason,
            minutes,
            customMessage: customMessage || null,
            latitude: location?.latitude || null,
            longitude: location?.longitude || null
        };

        await onSubmit(delayData);
        setSubmitting(false);
        handleClose();
    };

    const handleClose = () => {
        setReason('traffic');
        setMinutes(15);
        setCustomMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <i className="fas fa-clock text-orange-600 text-xl"></i>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Report Delay</h2>
                                <p className="text-sm text-gray-600">Notify students about delay</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <i className="fas fa-times text-gray-600"></i>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6  space-y-6">
                    {/* Delay Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Delay Reason
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {delayReasons.map((item) => (
                                <button
                                    key={item.value}
                                    onClick={() => setReason(item.value)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${reason === item.value
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-lg font-semibold">{item.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estimated Delay */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                            Estimated Delay (minutes)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="5"
                                max="120"
                                step="5"
                                value={minutes}
                                onChange={(e) => setMinutes(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="w-20 text-center">
                                <div className="text-2xl font-bold text-orange-600">{minutes}</div>
                                <div className="text-xs text-gray-600">mins</div>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-gray-600">
                            <span>5 min</span>
                            <span>2 hours</span>
                        </div>
                    </div>

                    {/* Custom Message */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Additional Message (Optional)
                        </label>
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Provide additional details about the delay..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        ></textarea>
                    </div>

                    {/* Location Info */}
                    {location && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-blue-800">
                                <i className="fas fa-map-marker-alt"></i>
                                <span className="font-medium">Current location will be included</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={handleClose}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Reporting...</span>
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane"></i>
                                <span>Report Delay</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DelayReportModal;
