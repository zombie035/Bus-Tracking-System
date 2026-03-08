// client/src/components/Driver/EmergencyButton.jsx
import React, { useState } from 'react';
import useGeolocation from '../../hooks/useGeolocation';

const EmergencyButton = ({ onEmergency, floating = false, isEmergencyActive = false }) => {
    const { location } = useGeolocation();
    const [showConfirm, setShowConfirm] = useState(false);
    const [alertType, setAlertType] = useState('breakdown');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const alertTypes = [
        { value: 'breakdown', label: 'Vehicle Breakdown', icon: 'fa-car-crash' },
        { value: 'accident', label: 'Accident', icon: 'fa-exclamation-triangle' },
        { value: 'route_blocked', label: 'Route Blocked', icon: 'fa-road' },
        { value: 'medical', label: 'Medical Emergency', icon: 'fa-ambulance' },
        { value: 'other', label: 'Other Emergency', icon: 'fa-bell' }
    ];

    const handleEmergency = async () => {
        setSending(true);
        const alertData = {
            alertType,
            message: message || `Emergency: ${alertTypes.find(t => t.value === alertType)?.label}`,
            latitude: location?.latitude || null,
            longitude: location?.longitude || null,
            timestamp: new Date()
        };
        await onEmergency(alertData);
        setSending(false);
        setShowConfirm(false);
        setMessage('');
    };

    // Emergency Confirmation Modal
    const renderModal = () => (
        <div className="emergency-modal-overlay">
            <div className="emergency-modal">
                {/* Emergency Header */}
                <div className="emergency-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <i className="fas fa-exclamation-triangle" style={{ fontSize: '28px' }}></i>
                        <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, letterSpacing: '1px' }}>EMERGENCY ALERT</h2>
                    </div>
                    <p style={{ fontSize: '13px', opacity: 0.85, marginTop: '6px' }}>This will notify all administrators immediately</p>
                </div>

                <div className="emergency-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Alert Type Selection */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '10px' }}>
                            Select Emergency Type
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {alertTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setAlertType(type.value)}
                                    className={`driver-alert-type-btn ${alertType === type.value ? 'selected' : ''}`}
                                >
                                    <i className={`fas ${type.icon}`}></i>
                                    <span>{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                            Additional Details (Optional)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe the emergency situation..."
                            rows={3}
                            className="driver-textarea"
                            style={{ minHeight: '80px' }}
                        />
                    </div>

                    {/* Location Info */}
                    {location && (
                        <div style={{
                            padding: '10px 14px', background: 'var(--driver-blue-dim)',
                            borderRadius: 'var(--driver-radius-sm)', border: '1px solid rgba(59,130,246,0.15)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--driver-blue)' }}>
                                <i className="fas fa-map-marker-alt"></i>
                                <span>GPS: {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}</span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                        <button
                            onClick={() => setShowConfirm(false)}
                            disabled={sending}
                            className="driver-btn driver-btn-ghost"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEmergency}
                            disabled={sending}
                            className="driver-btn driver-btn-danger"
                        >
                            {sending ? (
                                <>
                                    <div className="driver-spinner" style={{ width: '20px', height: '20px' }}></div>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-bell"></i>
                                    SEND ALERT
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Floating SOS Button
    if (floating) {
        return (
            <>
                <button
                    onClick={() => setShowConfirm(true)}
                    className={`sos-floating ${isEmergencyActive ? 'emergency-active' : ''}`}
                >
                    <i className="fas fa-exclamation-triangle sos-icon"></i>
                    <span className="sos-text">SOS</span>
                </button>
                {showConfirm && renderModal()}
            </>
        );
    }

    // Embedded inline button
    if (showConfirm) {
        return renderModal();
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            className="driver-btn driver-btn-danger driver-btn-xl"
        >
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
            }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '18px' }}></i>
            </div>
            <span>EMERGENCY ALERT</span>
        </button>
    );
};

export default EmergencyButton;
