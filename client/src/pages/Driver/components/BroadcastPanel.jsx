import React, { useState } from 'react';
import {
    MegaphoneIcon,
    PaperAirplaneIcon,
    MicrophoneIcon
} from '@heroicons/react/24/solid';

const BroadcastPanel = ({ onSendBroadcast, onClose }) => {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);

    const presets = [
        "🚦 Heavy Traffic Delay",
        "🔧 Mechanical Issue - Stopped",
        "🛑 Route Diversion Ahead",
        "⏳ Waiting for connecting bus",
        "🌧️ Weather Delay"
    ];

    const handleSend = () => {
        if (message.trim()) {
            onSendBroadcast(message);
            setMessage('');
        }
    };

    return (
        <div className="broadcast-panel glass-panel">
            <div className="panel-header">
                <MegaphoneIcon className="icon-medium" />
                <h3>BROADCAST MESSAGE</h3>
            </div>

            <div className="presets-container">
                <span className="label">QUICK ALERTS</span>
                <div className="presets-grid">
                    {presets.map((text, idx) => (
                        <button
                            key={idx}
                            className="btn-preset"
                            onClick={() => setMessage(text)}
                        >
                            {text}
                        </button>
                    ))}
                </div>
            </div>

            <div className="custom-message-container">
                <span className="label">CUSTOM MESSAGE</span>
                <div className="input-wrapper">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message to students..."
                        rows={3}
                    />
                    <button
                        className={`btn-mic ${isRecording ? 'recording' : ''}`}
                        onClick={() => setIsRecording(!isRecording)}
                    >
                        <MicrophoneIcon className="icon-small" />
                    </button>
                </div>
            </div>

            <div className="panel-actions">
                <button className="btn-send" onClick={handleSend} disabled={!message.trim()}>
                    <PaperAirplaneIcon className="icon-small" />
                    <span>SEND ALERt</span>
                </button>
            </div>
        </div>
    );
};

export default BroadcastPanel;
