// client/src/components/Student/QuickContactPanel.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const QuickContactPanel = ({ isOpen, onClose, onMessageSent }) => {
    const [messages, setMessages] = useState({ driver: [], admin: [] });
    const [selectedCategory, setSelectedCategory] = useState('driver');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchQuickMessages();
        }
    }, [isOpen]);

    const fetchQuickMessages = async () => {
        const result = await busService.getQuickMessages();
        if (result.success && result.messages) {
            setMessages(result.messages);
        }
    };

    const handleSendMessage = async (messageId, recipientType) => {
        setLoading(true);
        try {
            const result = await busService.sendQuickMessage(messageId, recipientType);
            if (result.success) {
                onMessageSent?.('Message sent successfully!');
                onClose();
            } else {
                alert(result.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Send message error:', error);
            alert('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const currentMessages = messages[selectedCategory] || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <i className="fas fa-comments text-blue-600"></i>
                            Quick Contact
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <i className="fas fa-times text-gray-600"></i>
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedCategory('driver')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === 'driver'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <i className="fas fa-user-tie mr-2"></i>
                            Driver
                        </button>
                        <button
                            onClick={() => setSelectedCategory('admin')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === 'admin'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <i className="fas fa-user-shield mr-2"></i>
                            Admin
                        </button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Select a predefined message to send to {selectedCategory}:
                    </p>

                    {currentMessages.length > 0 ? (
                        <div className="space-y-3">
                            {currentMessages.map((msg) => (
                                <button
                                    key={msg.id}
                                    onClick={() => handleSendMessage(msg.id, selectedCategory)}
                                    disabled={loading}
                                    className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-900 group-hover:text-blue-700">
                                            {msg.text}
                                        </span>
                                        <i className="fas fa-paper-plane text-gray-400 group-hover:text-blue-600"></i>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <i className="fas fa-inbox text-3xl mb-2"></i>
                            <p>No messages available</p>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="p-4 bg-blue-50 border-t border-blue-100">
                    <p className="text-xs text-blue-800 flex items-start gap-2">
                        <i className="fas fa-info-circle mt-0.5"></i>
                        <span>
                            For safety reasons, only predefined messages can be sent. For urgent matters, please call directly.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuickContactPanel;
