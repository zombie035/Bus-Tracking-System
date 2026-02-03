// client/src/components/Student/FeedbackModal.jsx
import React, { useState } from 'react';
import { busService } from '../../services/busService';

const FeedbackModal = ({ isOpen, onClose, onSubmitSuccess }) => {
    const [issueType, setIssueType] = useState('late_bus');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);

    // Get current location
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Location error:', error);
                }
            );
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            getCurrentLocation();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!description.trim()) {
            alert('Please provide a description');
            return;
        }

        setLoading(true);

        try {
            const result = await busService.reportIssue({
                issueType,
                description,
                priority,
                latitude: location?.latitude,
                longitude: location?.longitude
            });

            if (result.success) {
                onSubmitSuccess?.('Feedback submitted successfully!');
                setDescription('');
                setIssueType('late_bus');
                setPriority('medium');
                onClose();
            } else {
                alert(result.message || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error('Submit feedback error:', error);
            alert('Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <i className="fas fa-comment-alt text-blue-600"></i>
                            Report Issue
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <i className="fas fa-times text-gray-600"></i>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        {/* Issue Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Issue Type *
                            </label>
                            <select
                                value={issueType}
                                onChange={(e) => setIssueType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="late_bus">Late Bus</option>
                                <option value="wrong_stop">Wrong Stop</option>
                                <option value="app_issue">App Issue</option>
                                <option value="driver_issue">Driver Issue</option>
                                <option value="safety_concern">Safety Concern</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Priority
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {['low', 'medium', 'high', 'urgent'].map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${priority === p
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please describe the issue in detail..."
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {description.length}/500 characters
                            </p>
                        </div>

                        {/* Location Info */}
                        {location && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                                <i className="fas fa-map-marker-alt"></i>
                                Location captured
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane"></i>
                                    Submit
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
