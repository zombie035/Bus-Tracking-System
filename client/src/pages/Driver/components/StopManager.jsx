import React, { useEffect, useRef } from 'react';
import {
    CheckCircleIcon,
    MapPinIcon,
    ClockIcon
} from '@heroicons/react/24/solid';

const StopManager = ({ stops, currentStopIndex, onSkipStop }) => {
    const listRef = useRef(null);

    // Auto-scroll to current stop
    useEffect(() => {
        if (listRef.current) {
            const activeElement = listRef.current.querySelector('.stop-item.active');
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentStopIndex]);

    return (
        <div className="stop-manager-container">
            <div className="stop-list-header">
                <h3>ROUTE MANIFEST</h3>
                <span className="stop-count">{currentStopIndex} / {stops.length} STOPS</span>
            </div>

            <div className="stop-list" ref={listRef}>
                {stops.map((stop, index) => {
                    // Determine Status
                    let status = 'upcoming';
                    if (index < currentStopIndex) status = 'completed';
                    if (index === currentStopIndex) status = 'active';

                    return (
                        <div key={stop.id || index} className={`stop-item ${status}`}>
                            {/* Timeline Line */}
                            <div className="stop-timeline">
                                <div className="timeline-line"></div>
                                <div className="timeline-point">
                                    {status === 'completed' && <CheckCircleIcon />}
                                    {status === 'active' && <MapPinIcon className="pulse" />}
                                    {status === 'upcoming' && <div className="dot"></div>}
                                </div>
                            </div>

                            {/* Stop Content */}
                            <div className="stop-content">
                                <div className="stop-info">
                                    <span className="stop-name">{stop.name}</span>
                                    <span className="stop-meta">
                                        {status === 'completed' ? 'Departed' : status === 'active' ? 'Current Stop' : 'Upcoming'}
                                    </span>
                                </div>

                                {/* Timings */}
                                <div className="stop-timing">
                                    <ClockIcon className="icon-tiny" />
                                    <span>{stop.arrivalTime || '--:--'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StopManager;
