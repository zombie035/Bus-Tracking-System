import React, { useState } from 'react';
import {
    ExclamationTriangleIcon,
    TruckIcon,
    UserIcon,
    DevicePhoneMobileIcon,
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { busService } from '../../services/busService';
import { toast } from 'react-toastify';

const FeedbackSheetContent = ({ onClose }) => {
    const [issueType, setIssueType] = useState('late_bus');
    const [description, setDescription] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const issueTypes = [
        { id: 'late_bus', label: 'Report Delay', icon: ExclamationTriangleIcon, color: 'text-orange-500', bg: 'bg-orange-50' },
        { id: 'safety_concern', label: 'Bus Issue', icon: TruckIcon, color: 'text-red-500', bg: 'bg-red-50' },
        { id: 'driver_issue', label: 'Driver Feedback', icon: UserIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'app_issue', label: 'App Issue', icon: DevicePhoneMobileIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.error('Please describe the issue');
            return;
        }

        setSubmitting(true);
        try {
            const result = await busService.reportIssue({
                issueType,
                description,
                priority: isUrgent ? 'high' : 'medium'
            });

            if (result.success) {
                toast.success('Report submitted successfully');
                setDescription('');
                setIssueType('late_bus');
                setIsUrgent(false);
                if (onClose) onClose();
            } else {
                toast.error(result.message || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Feedback submit error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-6 pt-2 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold text-gray-800">Report an Issue</h2>
                    <div className="p-2 bg-gray-100 rounded-full">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-500" />
                    </div>
                </div>
                <p className="text-sm text-gray-500">Help us improve your transport experience</p>
            </div>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Issue Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 block">What's the issue?</label>
                    <div className="grid grid-cols-2 gap-3">
                        {issueTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setIssueType(type.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${issueType === type.id
                                        ? `border-${type.color.split('-')[1]}-500 ${type.bg} ring-1 ring-${type.color.split('-')[1]}-500`
                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <type.icon className={`w-8 h-8 mb-2 ${issueType === type.id ? type.color : 'text-gray-400'}`} />
                                <span className={`text-xs font-bold ${issueType === type.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {type.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 block">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please describe what happened..."
                        className="w-full h-32 p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none resize-none text-sm transition-all"
                    />
                </div>

                {/* Priority Toggle */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Mark as Urgent</p>
                            <p className="text-xs text-gray-500">Requires immediate attention</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsUrgent(!isUrgent)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isUrgent ? 'bg-red-500' : 'bg-gray-300'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isUrgent ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>

            </div>

            {/* Footer / Submit Button */}
            <div className="p-6 border-t border-gray-100 bg-white">
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-black text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
                >
                    {submitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending...</span>
                        </>
                    ) : (
                        <>
                            <PaperAirplaneIcon className="w-5 h-5" />
                            <span>Submit Report</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default FeedbackSheetContent;
