import React from 'react';
import {
    ClockIcon,
    MapIcon,
    BoltIcon,
    UserGroupIcon,
    StopIcon
} from '@heroicons/react/24/solid';

const DriverAnalytics = ({ metrics, tripState }) => {
    const {
        duration = 0,
        distance = 0,
        avgSpeed = 0,
        stopsCompleted = 0,
        studentCount = 0
    } = metrics;

    // Format Duration
    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="analytics-panel glass-panel">
            <h3>TRIP ANALYTICS</h3>

            <div className="metrics-grid">
                <div className="metric-card">
                    <ClockIcon className="icon-medium" />
                    <div className="metric-value">{formatDuration(duration)}</div>
                    <div className="metric-label">DURATION</div>
                </div>

                <div className="metric-card">
                    <MapIcon className="icon-medium" />
                    <div className="metric-value">{distance.toFixed(1)} km</div>
                    <div className="metric-label">DISTANCE</div>
                </div>

                <div className="metric-card">
                    <BoltIcon className="icon-medium" />
                    <div className="metric-value">{avgSpeed.toFixed(1)} km/h</div>
                    <div className="metric-label">AVG SPEED</div>
                </div>

                <div className="metric-card">
                    <StopIcon className="icon-medium" />
                    <div className="metric-value">{stopsCompleted}</div>
                    <div className="metric-label">STOPS DONE</div>
                </div>

                <div className="metric-card">
                    <UserGroupIcon className="icon-medium" />
                    <div className="metric-value">{studentCount}</div>
                    <div className="metric-label">STUDENTS</div>
                </div>
            </div>

            {tripState === 'COMPLETED' && (
                <div className="analytics-footer">
                    <p>Trip log has been submitted to admin.</p>
                </div>
            )}
        </div>
    );
};

export default DriverAnalytics;
