// client/src/components/Driver/TripControlPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDriver, TRIP_STATES } from '../../contexts/DriverContext';

const TripControlPanel = ({ onStateChange }) => {
  const {
    tripState,
    startTrip,
    pauseTrip,
    resumeTrip,
    endTrip,
    tripStartTime,
    analytics,
    location
  } = useDriver();

  const [loading, setLoading] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [duration, setDuration] = useState('00:00:00');
  const timerRef = useRef(null);

  // Live timer
  useEffect(() => {
    if (tripStartTime && (tripState === TRIP_STATES.EN_ROUTE || tripState === TRIP_STATES.STARTED || tripState === TRIP_STATES.DELAYED)) {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const diff = now - new Date(tripStartTime);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tripStartTime, tripState]);

  const handleStartTrip = async () => {
    setLoading(true);
    const result = await startTrip();
    setLoading(false);
    if (onStateChange) onStateChange(TRIP_STATES.EN_ROUTE);
    return result;
  };

  const handlePauseTrip = async () => {
    setLoading(true);
    await pauseTrip();
    setLoading(false);
    if (onStateChange) onStateChange(TRIP_STATES.DELAYED);
  };

  const handleResumeTrip = async () => {
    setLoading(true);
    await resumeTrip();
    setLoading(false);
    if (onStateChange) onStateChange(TRIP_STATES.EN_ROUTE);
  };

  const handleEndTrip = async () => {
    setLoading(true);
    const result = await endTrip();
    setLoading(false);
    setShowEndConfirm(false);
    if (onStateChange) onStateChange(TRIP_STATES.COMPLETED);
    return result;
  };

  const getStateInfo = () => {
    switch (tripState) {
      case TRIP_STATES.NOT_STARTED:
        return { label: 'READY TO START', color: 'var(--driver-text-muted)', badge: 'ready' };
      case TRIP_STATES.STARTED:
        return { label: 'STARTING...', color: 'var(--driver-success)', badge: 'live' };
      case TRIP_STATES.EN_ROUTE:
        return { label: 'ON ROUTE', color: 'var(--driver-success)', badge: 'live' };
      case TRIP_STATES.DELAYED:
        return { label: 'DELAYED', color: 'var(--driver-warning)', badge: 'delayed' };
      case TRIP_STATES.EMERGENCY:
        return { label: 'EMERGENCY', color: 'var(--driver-danger)', badge: 'emergency' };
      case TRIP_STATES.COMPLETED:
        return { label: 'COMPLETED', color: 'var(--driver-primary)', badge: 'completed' };
      default:
        return { label: 'UNKNOWN', color: 'var(--driver-text-muted)', badge: 'offline' };
    }
  };

  const stateInfo = getStateInfo();

  return (
    <div className="driver-glass-card">
      {/* Status Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--driver-border)',
        background: 'rgba(var(--driver-bg), 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={`driver-badge ${stateInfo.badge}`}>
              <div className="status-dot"></div>
            </div>
            <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--driver-text)', letterSpacing: '1px' }}>
              {stateInfo.label}
            </span>
          </div>
          {tripState === TRIP_STATES.EN_ROUTE && tripStartTime && (
            <div style={{
              fontFamily: 'monospace', fontSize: '24px', fontWeight: 900,
              color: 'var(--driver-success)', letterSpacing: '2px'
            }}>
              {duration}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {tripState === TRIP_STATES.EN_ROUTE && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px',
          background: 'var(--driver-border)', borderBottom: '1px solid var(--driver-border)'
        }}>
          <div style={{ background: 'var(--driver-surface)', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--driver-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>SPEED</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--driver-text)', fontVariantNumeric: 'tabular-nums' }}>
              {location?.speed || 0} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--driver-text-muted)' }}>km/h</span>
            </div>
          </div>
          <div style={{ background: 'var(--driver-surface)', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--driver-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>STOPS</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--driver-text)' }}>{analytics.stopsCompleted}</div>
          </div>
          <div style={{ background: 'var(--driver-surface)', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--driver-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>AVG</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--driver-text)', fontVariantNumeric: 'tabular-nums' }}>
              {analytics.averageSpeed.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--driver-text-muted)' }}>km/h</span>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* NOT STARTED */}
        {tripState === TRIP_STATES.NOT_STARTED && (
          <button
            onClick={handleStartTrip}
            disabled={loading}
            className="driver-btn driver-btn-primary driver-btn-xl"
          >
            {loading ? (
              <div className="driver-spinner"></div>
            ) : (
              <>
                <i className="fas fa-play-circle" style={{ fontSize: '24px' }}></i>
                <span>START TRIP</span>
              </>
            )}
          </button>
        )}

        {/* EN_ROUTE */}
        {(tripState === TRIP_STATES.EN_ROUTE || tripState === TRIP_STATES.STARTED) && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={handlePauseTrip}
                disabled={loading || tripState === TRIP_STATES.DELAYED}
                className="driver-btn driver-btn-warning"
              >
                <i className="fas fa-pause" style={{ fontSize: '18px' }}></i>
                <span>PAUSE</span>
              </button>

              <button
                onClick={() => setShowEndConfirm(true)}
                disabled={loading}
                className="driver-btn driver-btn-danger"
              >
                <i className="fas fa-stop-circle" style={{ fontSize: '18px' }}></i>
                <span>END</span>
              </button>
            </div>
          </>
        )}

        {/* DELAYED */}
        {tripState === TRIP_STATES.DELAYED && (
          <>
            <button
              onClick={handleResumeTrip}
              disabled={loading}
              className="driver-btn driver-btn-primary driver-btn-xl"
            >
              <i className="fas fa-play" style={{ fontSize: '24px' }}></i>
              <span>RESUME TRIP</span>
            </button>
            <button
              onClick={() => setShowEndConfirm(true)}
              disabled={loading}
              className="driver-btn driver-btn-danger"
            >
              <i className="fas fa-stop-circle" style={{ fontSize: '18px' }}></i>
              <span>END TRIP</span>
            </button>
          </>
        )}

        {/* COMPLETED */}
        {tripState === TRIP_STATES.COMPLETED && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--driver-primary)', marginBottom: '8px' }}>
              Trip Completed!
            </div>
            <div style={{ color: 'var(--driver-text-dim)', fontSize: '14px' }}>
              <span style={{ fontWeight: 700 }}>{analytics.stopsCompleted}</span> stops completed
            </div>
          </div>
        )}

        {/* EMERGENCY */}
        {tripState === TRIP_STATES.EMERGENCY && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--driver-danger)', marginBottom: '8px' }}>
              EMERGENCY ACTIVE
            </div>
            <div style={{ color: 'var(--driver-text-dim)', fontSize: '14px' }}>
              Emergency services have been notified
            </div>
          </div>
        )}
      </div>

      {/* End Trip Confirmation Modal */}
      {showEndConfirm && (
        <div className="overlay-wrapper">
          <div className="overlay-backdrop" onClick={() => setShowEndConfirm(false)}></div>
          <div className="driver-card overlay-content" style={{ maxWidth: '320px', padding: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'var(--driver-danger-dim)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: '24px', color: 'var(--driver-danger)'
              }}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--driver-text)', marginBottom: '8px' }}>End Trip?</h3>
              <p style={{ color: 'var(--driver-text-dim)', marginBottom: '24px' }}>Are you sure you want to end this trip?</p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="driver-btn driver-btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndTrip}
                  disabled={loading}
                  className="driver-btn driver-btn-danger"
                  style={{ flex: 1 }}
                >
                  {loading ? 'Ending...' : 'End Trip'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripControlPanel;
