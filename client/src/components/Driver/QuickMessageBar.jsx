// client/src/components/Driver/QuickMessageBar.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const QuickMessageBar = () => {
    const [messages, setMessages] = useState([]);
    const [customMessage, setCustomMessage] = useState('');
    const [showCustom, setShowCustom] = useState(false);
    const [sending, setSending] = useState(false);
    const [lastSent, setLastSent] = useState(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await busService.getQuickMessages();
            if (response.success) {
                // Ensure messages is always an array
                const messagesData = response.messages || {};
                setMessages(Array.isArray(messagesData) ? messagesData : []);
            }
        } catch (error) {
            console.error('Error fetching quick messages:', error);
            setMessages([]);
        }
    };

    const sendMessage = async (messageId = null, text = null) => {
        setSending(true);

        try {
            const response = await busService.sendQuickMessage({
                messageId: messageId,
                customMessage: text
            });

            if (response.success) {
                setCustomMessage('');
                setShowCustom(false);
                setLastSent(response.sentMessage);

                // Show success feedback
                setTimeout(() => setLastSent(null), 5000);
            } else {
                alert('❌ Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('❌ Error sending message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && customMessage.trim()) {
            sendMessage(null, customMessage);
        }
    };

    const messageTypes = {
        delay: { icon: 'fa-clock', color: 'orange' },
        arrival: { icon: 'fa-map-marker', color: 'green' },
        departure: { icon: 'fa-bus', color: 'blue' },
        custom: { icon: 'fa-comment', color: 'purple' }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow">
                            <i className="fas fa-comment-dots"></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Quick Messages</h3>
                            <p className="text-xs text-gray-600">Send updates to students</p>
                        </div>
                    </div>
                    {sending && (
                        <div className="flex items-center gap-2 text-sm text-purple-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            <span className="font-medium">Sending...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Message */}
            {lastSent && (
                <div className="p-3 bg-green-50 border-b border-green-200 flex items-start gap-2 animate-fade-in">
                    <i className="fas fa-check-circle text-green-600 mt-0.5"></i>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">Message sent successfully!</p>
                        <p className="text-xs text-green-700 mt-0.5">"{lastSent}"</p>
                    </div>
                </div>
            )}

            {/* Quick Message Buttons */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {messages.slice(0, 6).map((msg) => {
                        const typeStyle = messageTypes[msg.messageType] || messageTypes.custom;
                        return (
                            <button
                                key={msg.id}
                                onClick={() => sendMessage(msg.id)}
                                disabled={sending}
                                className={`px-3 py-3 bg-${typeStyle.color}-100 hover:bg-${typeStyle.color}-200 text-${typeStyle.color}-800 rounded-lg text-sm font-medium transition-all disabled:opacity-50 text-left flex items-start gap-2 group`}
                            >
                                <i className={`fas ${typeStyle.icon} mt-1 group-hover:scale-110 transition-transform`}></i>
                                <span className="line-clamp-2">{msg.messageText}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Custom Message Input */}
                {showCustom ? (
                    <div className="space-y-2">
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your custom message to students..."
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => sendMessage(null, customMessage)}
                                disabled={!customMessage.trim() || sending}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-paper-plane"></i>
                                <span>Send Message</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowCustom(false);
                                    setCustomMessage('');
                                }}
                                disabled={sending}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                            <i className="fas fa-info-circle"></i>
                            <span>Press Enter to send or click the Send button</span>
                        </p>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCustom(true)}
                        disabled={sending}
                        className="w-full px-4 py-3 border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 rounded-lg font-medium text-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-plus-circle"></i>
                        <span>Send Custom Message</span>
                    </button>
                )}

                {/* Info Text */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800 flex items-start gap-2">
                        <i className="fas fa-info-circle mt-0.5"></i>
                        <span>Messages will be broadcast to all students on your bus route</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuickMessageBar;
