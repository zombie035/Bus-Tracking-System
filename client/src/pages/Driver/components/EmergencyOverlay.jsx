import React from 'react';
import {
    ExclamationTriangleIcon,
    ShieldExclamationIcon,
    WrenchScrewdriverIcon,
    PhoneIcon,
    XMarkIcon
} from '@heroicons/react/24/solid';

const EmergencyOverlay = ({ isActive, onTrigger, onResolve, onCancel }) => {
    if (!isActive) return null;

    return (
        <div className="emergency-overlay">
            <div className="emergency-container">
                <div className="emergency-header">
                    <ExclamationTriangleIcon className="icon-huge blink" />
                    <h2>EMERGENCY DECLARATION</h2>
                    <p>SELECT EMERGENCY TYPE TO BROADCAST ALERT</p>
                </div>

                <div className="emergency-grid">
                    <button className="emergency-btn btn-accident" onClick={() => onTrigger('ACCIDENT')}>
                        <ExclamationTriangleIcon className="icon-large" />
                        <span>ACCIDENT</span>
                    </button>

                    <button className="emergency-btn btn-breakdown" onClick={() => onTrigger('BREAKDOWN')}>
                        <WrenchScrewdriverIcon className="icon-large" />
                        <span>BREAKDOWN</span>
                    </button>

                    <button className="emergency-btn btn-medical" onClick={() => onTrigger('MEDICAL')}>
                        <div className="icon-large-text">+</div>
                        <span>MEDICAL</span>
                    </button>

                    <button className="emergency-btn btn-security" onClick={() => onTrigger('SECURITY')}>
                        <ShieldExclamationIcon className="icon-large" />
                        <span>SECURITY</span>
                    </button>
                </div>

                <div className="emergency-actions">
                    <button className="btn-resolve" onClick={onResolve}>
                        <CheckCircleIcon className="icon-medium" />
                        <span>RESOLVE EMERGENCY</span>
                    </button>

                    <button className="btn-cancel" onClick={onCancel}>
                        <XMarkIcon className="icon-medium" />
                        <span>CANCEL</span>
                    </button>
                </div>

                <div className="emergency-footer">
                    <p>This will alert Admin & Students immediately.</p>
                    <p>GPS Location will be shared.</p>
                </div>
            </div>
        </div>
    );
};

// Start Button Component (Floating SOS)
export const SOSButton = ({ onClick }) => (
    <button className="floating-sos-btn" onClick={onClick}>
        <div className="sos-text">SOS</div>
        <ExclamationTriangleIcon className="icon-small" />
    </button>
);

export default EmergencyOverlay;
