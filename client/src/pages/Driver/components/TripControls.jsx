import React from 'react';
import {
    PlayIcon,
    PauseIcon,
    StopIcon,
    MapPinIcon,
    ArrowRightIcon,
    ForwardIcon,
    CheckCircleIcon
} from '@heroicons/react/24/solid';

const TripControls = ({
    tripState,
    nextStop,
    currentStop,
    onStartTrip,
    onPauseTrip,
    onResumeTrip,
    onEndTrip,
    onArriveStop,
    onDepartStop,
    onSkipStop // Secondary action
}) => {

    // Main Action Button Logic
    const renderMainButton = () => {
        switch (tripState) {
            case 'NOT_STARTED':
                return (
                    <button className="control-btn-main btn-start" onClick={onStartTrip}>
                        <PlayIcon className="icon-large" />
                        <div className="btn-text">
                            <span className="btn-label">START TRIP</span>
                            <span className="btn-sublabel">Ready for Departure</span>
                        </div>
                    </button>
                );
            case 'STARTED':
            case 'EN_ROUTE':
                return (
                    <button
                        className="control-btn-main btn-action"
                        onClick={onArriveStop}
                        disabled={!nextStop}
                    >
                        <MapPinIcon className="icon-large" />
                        <div className="btn-text">
                            <span className="btn-label">ARRIVED AT</span>
                            <span className="btn-sublabel">{nextStop ? nextStop.name : 'Unknown Stop'}</span>
                        </div>
                    </button>
                );
            case 'ARRIVED':
                return (
                    <button className="control-btn-main btn-go" onClick={onDepartStop}>
                        <ArrowRightIcon className="icon-large" />
                        <div className="btn-text">
                            <span className="btn-label">DEPART</span>
                            <span className="btn-sublabel">Next: {nextStop ? nextStop.name : 'Route End'}</span>
                        </div>
                    </button>
                );
            case 'DELAYED':
                return (
                    <button className="control-btn-main btn-resume" onClick={onResumeTrip}>
                        <PlayIcon className="icon-large" />
                        <div className="btn-text">
                            <span className="btn-label">RESUME TRIP</span>
                            <span className="btn-sublabel">Continue Route</span>
                        </div>
                    </button>
                );
            case 'EMERGENCY':
                return (
                    <div className="control-status-message emergency-active">
                        <span className="blink">⚠️ EMERGENCY ACTIVE ⚠️</span>
                        <span className="sub-msg">Resolve to Continue</span>
                    </div>
                );
            case 'COMPLETED':
                return (
                    <button className="control-btn-main btn-end" onClick={onEndTrip}>
                        <CheckCircleIcon className="icon-large" />
                        <div className="btn-text">
                            <span className="btn-label">COMPLETE TRIP</span>
                            <span className="btn-sublabel">Submit Logs & Close</span>
                        </div>
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="trip-controls-container">
            {/* Main Primary Action */}
            <div className="primary-control">
                {renderMainButton()}
            </div>

            {/* Secondary Controls Row */}
            <div className="secondary-controls">
                {/* Delay / Pause Button */}
                {tripState !== 'NOT_STARTED' && tripState !== 'COMPLETED' && tripState !== 'EMERGENCY' && tripState !== 'DELAYED' && (
                    <button className="btn-secondary-action btn-warning" onClick={onPauseTrip}>
                        <PauseIcon className="icon-medium" />
                        <span>DELAY / PAUSE</span>
                    </button>
                )}

                {/* Skip Stop Button (Only when En Route or Started) */}
                {(tripState === 'EN_ROUTE' || tripState === 'STARTED') && nextStop && (
                    <button className="btn-secondary-action btn-neutral" onClick={onSkipStop}>
                        <ForwardIcon className="icon-medium" />
                        <span>SKIP STOP</span>
                    </button>
                )}

                {/* End Trip Early (Visible if started) */}
                {tripState !== 'NOT_STARTED' && tripState !== 'COMPLETED' && (
                    <button className="btn-secondary-action btn-danger-outline" onClick={onEndTrip}>
                        <StopIcon className="icon-medium" />
                        <span>END TRIP</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default TripControls;
