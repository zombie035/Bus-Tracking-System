import React, { useState, useEffect } from 'react';
import {
    SignalIcon,
    WifiIcon,
    SignalSlashIcon,
    UserCircleIcon,
    ClockIcon
} from '@heroicons/react/24/solid';

const TopNavigationBar = ({
    user,
    isConnected,
    gpsStrength = 'high',
    tripDuration = 0
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Clock Ticker
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Format Duration (seconds -> HH:MM:SS)
    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} `;
    };

    return (
        <div className="top-navbar-control">
            {/* LEFT: Branding & Driver Info */}
            <div className="navbar-left">
                <div className="app-brand">
                    <span className="brand-icon">🚍</span>
                    <span className="brand-text">CONTROL CENTER</span>
                </div>
                <div className="driver-badge">
                    <UserCircleIcon className="icon-small" />
                    <span className="driver-name">{user?.name || 'Driver'}</span>
                    <span className="driver-id">ID: {user?.driverId || '---'}</span>
                </div>
            </div>

            {/* CENTER: Trip Timer (if active) */}
            <div className="navbar-center">
                {tripDuration > 0 && (
                    <div className="trip-timer">
                        <span className="timer-label">TRIP TIME</span>
                        <span className="timer-value">{formatDuration(tripDuration)}</span>
                    </div>
                )}
            </div>

            {/* RIGHT: Status Indicators & Clock */}
            <div className="navbar-right">
                {/* Network Status */}
                <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
                    {isConnected ? <WifiIcon className="icon-small" /> : <SignalSlashIcon className="icon-small" />}
                    <span className="status-text">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>

                {/* GPS Status */}
                <div className={`status-indicator gps ${gpsStrength}`}>
                    <SignalIcon className="icon-small" />
                    <span className="status-text">GPS: {gpsStrength.toUpperCase()}</span>
                </div>

                {/* Digital Clock */}
                <div className="digital-clock">
                    <ClockIcon className="icon-small" />
                    <span className="time-text">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TopNavigationBar;
