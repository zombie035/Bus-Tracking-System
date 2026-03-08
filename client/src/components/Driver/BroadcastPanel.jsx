// client/src/components/Driver/BroadcastPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDriver } from '../../contexts/DriverContext';
import { busService } from '../../services/busService';

const BroadcastPanel = ({ compact = false }) => {
  const { sendBroadcast } = useDriver();
  const [messages, setMessages] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [priority, setPriority] = useState('normal');
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setCustomMessage(transcript);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await busService.getQuickMessages();
      if (response.success) {
        setMessages(Array.isArray(response.messages) ? response.messages : []);
      }
    } catch (error) {
      console.error('Error fetching quick messages:', error);
      setMessages([]);
    }
  };

  const handleSend = async (messageId = null, text = null) => {
    if (!text && !messageId) return;

    setSending(true);
    try {
      const messageText = text || messages.find(m => m.id === messageId)?.messageText;
      sendBroadcast(messageText, priority);

      await busService.sendQuickMessage({
        messageId: messageId,
        customMessage: text,
        priority: priority
      });

      setCustomMessage('');
      setShowCustom(false);
      setLastSent(messageText);
      setPriority('normal');
      setTimeout(() => setLastSent(null), 5000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser');
      return;
    }
    recognitionRef.current.start();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && customMessage.trim() && !e.shiftKey) {
      e.preventDefault();
      handleSend(null, customMessage);
    }
  };

  const messagePresets = [
    { id: 1, text: 'Bus arriving in 5 minutes', icon: 'fa-clock', color: 'var(--driver-primary)' },
    { id: 2, text: 'Bus arriving in 10 minutes', icon: 'fa-clock', color: 'var(--driver-primary)' },
    { id: 3, text: 'Currently at stop', icon: 'fa-map-marker', color: 'var(--driver-success)' },
    { id: 4, text: 'Delayed due to traffic', icon: 'fa-traffic-light', color: 'var(--driver-warning)' },
    { id: 5, text: 'Running late', icon: 'fa-exclamation-triangle', color: 'var(--driver-danger)' },
    { id: 6, text: 'On the way', icon: 'fa-bus', color: '#8b5cf6' },
  ];

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {messagePresets.slice(0, 4).map((msg) => (
            <button
              key={msg.id}
              onClick={() => handleSend(msg.id)}
              disabled={sending}
              className="driver-btn driver-btn-ghost"
              style={{ padding: '10px 12px', justifyContent: 'flex-start', background: 'var(--driver-surface)' }}
            >
              <i className={`fas ${msg.icon}`} style={{ color: msg.color }}></i>
              <span style={{ fontSize: '12px', textAlign: 'left' }}>{msg.text}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowCustom(true)}
          disabled={sending}
          className="driver-btn driver-btn-ghost"
          style={{ padding: '10px', textTransform: 'none' }}
        >
          <i className="fas fa-plus-circle"></i>
          <span>Custom Message</span>
        </button>
      </div>
    );
  }

  return (
    <div className="driver-glass-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="driver-glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--driver-border)' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--driver-text)', margin: 0 }}>Broadcast System</h3>
          <p style={{ color: 'var(--driver-text-muted)', fontSize: '13px', margin: '2px 0 0' }}>Send updates to students</p>
        </div>
        {sending && <div className="driver-spinner"></div>}
      </div>

      {/* Success Message */}
      {lastSent && (
        <div style={{
          padding: '12px 16px', background: 'var(--driver-success-dim)',
          borderBottom: '1px solid rgba(16,185,129,0.2)',
          display: 'flex', alignItems: 'flex-start', gap: '10px'
        }}>
          <i className="fas fa-check-circle" style={{ color: 'var(--driver-success)', marginTop: '2px' }}></i>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--driver-success)', margin: 0 }}>Message sent!</p>
            <p style={{ fontSize: '12px', color: 'var(--driver-text-dim)', margin: '2px 0 0' }}>"{lastSent}"</p>
          </div>
        </div>
      )}

      {/* Priority Toggle */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--driver-border)' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--driver-text-dim)', marginBottom: '8px' }}>Priority:</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'High' },
            { value: 'emergency', label: 'Emergency' }
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={`driver-btn ${priority === p.value ? (p.value === 'emergency' ? 'driver-btn-danger' : 'driver-btn-primary') : 'driver-btn-ghost'}`}
              style={{ flex: 1, padding: '8px' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Message Buttons */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--driver-border)' }}>
        <div className="driver-section-header">
          <i className="fas fa-bolt" style={{ color: 'var(--driver-warning)' }}></i>
          <span>Quick Messages</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {messagePresets.map((msg) => (
            <button
              key={msg.id}
              onClick={() => handleSend(msg.id)}
              disabled={sending}
              className="driver-btn driver-btn-ghost"
              style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px' }}
            >
              <i className={`fas ${msg.icon}`} style={{ color: msg.color, flexShrink: 0 }}></i>
              <span style={{ fontSize: '13px' }}>{msg.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Message */}
      <div style={{ padding: '16px' }}>
        <div className="driver-section-header">
          <i className="fas fa-edit" style={{ color: '#8b5cf6' }}></i>
          <span>Custom Message</span>
        </div>

        {showCustom ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your custom message..."
                rows={3}
                className="driver-textarea"
                autoFocus
                style={{
                  width: '100%', padding: '12px', paddingRight: '52px',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--driver-border)',
                  fontFamily: 'inherit', color: 'var(--driver-text)', background: 'var(--driver-surface-active)'
                }}
              />
              <button
                onClick={handleVoiceInput}
                style={{
                  position: 'absolute', bottom: '10px', right: '10px',
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--driver-surface)', border: '1px solid var(--driver-border)',
                  color: 'var(--driver-text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Voice input"
              >
                <i className="fas fa-microphone"></i>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleSend(null, customMessage)}
                disabled={!customMessage.trim() || sending}
                className="driver-btn driver-btn-primary"
                style={{ flex: 1 }}
              >
                <i className="fas fa-paper-plane"></i>
                <span>Send</span>
              </button>
              <button
                onClick={() => { setShowCustom(false); setCustomMessage(''); }}
                disabled={sending}
                className="driver-btn driver-btn-ghost"
                style={{ flex: 0 }}
              >
                Cancel
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--driver-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-info-circle"></i>
              Press Enter to send. Click mic for voice input.
            </p>
          </div>
        ) : (
          <button
            onClick={() => setShowCustom(true)}
            disabled={sending}
            className="driver-btn driver-btn-ghost"
            style={{ borderStyle: 'dashed', textTransform: 'none', width: '100%' }}
          >
            <i className="fas fa-plus-circle"></i>
            <span>Send Custom Message</span>
          </button>
        )}

        <div style={{
          marginTop: '12px', padding: '10px 14px',
          background: 'var(--driver-primary-dim)', borderRadius: 'var(--driver-radius-sm)',
          border: '1px solid rgba(59,130,246,0.15)'
        }}>
          <p style={{ fontSize: '12px', color: 'var(--driver-primary)', display: 'flex', alignItems: 'flex-start', gap: '8px', margin: 0 }}>
            <i className="fas fa-info-circle" style={{ marginTop: '2px' }}></i>
            Messages will be broadcast to all students on your route in real-time
          </p>
        </div>
      </div>
    </div>
  );
};

export default BroadcastPanel;
