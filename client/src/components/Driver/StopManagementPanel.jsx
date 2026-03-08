// client/src/components/Driver/StopManagementPanel.jsx
import React, { useState, useMemo } from 'react';
import { useDriver } from '../../contexts/DriverContext';

const StopManagementPanel = ({ compact = false }) => {
  const {
    routeStops,
    currentStopIndex,
    completedStops,
    arriveAtStop,
    departFromStop,
    skipStop,
    tripState,
    stopArrivalTime
  } = useDriver();

  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [boardingCount, setBoardingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentStop = routeStops[currentStopIndex];
  const nextStop = routeStops[currentStopIndex + 1];

  const handleArrive = async () => {
    if (!currentStop) return;
    setLoading(true);
    await arriveAtStop(currentStopIndex);
    setLoading(false);
  };

  const handleDepart = async () => {
    if (!currentStop) return;
    setLoading(true);
    await departFromStop(currentStopIndex, boardingCount);
    setBoardingCount(0);
    setLoading(false);
  };

  const handleSkip = async () => {
    if (!currentStop || !skipReason) return;
    setLoading(true);
    await skipStop(currentStopIndex, skipReason);
    setSkipReason('');
    setShowSkipModal(false);
    setLoading(false);
  };

  const getStopStatus = (index) => {
    if (completedStops.some(s => s.stopOrder === index + 1)) return 'completed';
    if (index === currentStopIndex) return 'current';
    if (index < currentStopIndex) return 'skipped';
    return 'upcoming';
  };

  if (!routeStops || routeStops.length === 0) {
    return (
      <div className="driver-glass-card" style={{ padding: '32px', textAlign: 'center' }}>
        <i className="fas fa-map-pin" style={{ fontSize: '28px', color: 'var(--driver-text-muted)', marginBottom: '12px', display: 'block' }}></i>
        <p style={{ color: 'var(--driver-text-muted)' }}>No stops assigned</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="driver-glass-card" style={{ overflow: 'hidden' }}>
        {/* Current Stop Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '2px solid var(--driver-success)',
          background: 'var(--driver-success-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'var(--driver-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '14px'
            }}>
              {currentStopIndex + 1}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--driver-text)', fontSize: '15px' }}>{currentStop?.stopName || 'No Stop'}</div>
              <div style={{ fontSize: '12px', color: 'var(--driver-success)' }}>Current Stop</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--driver-text-muted)' }}>{completedStops.length}/{routeStops.length}</div>
        </div>

        {/* Action Buttons */}
        {tripState === 'EN_ROUTE' && currentStop && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={handleDepart} disabled={loading} className="driver-btn driver-btn-primary">
              <i className="fas fa-check-circle" style={{ fontSize: '18px' }}></i>
              <span>DEPART FROM STOP</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => setShowSkipModal(true)} disabled={loading} className="driver-btn driver-btn-ghost" style={{ padding: '10px' }}>
                <i className="fas fa-forward"></i>
                <span>Skip</span>
              </button>
              <div style={{
                padding: '10px', borderRadius: 'var(--driver-radius-sm)',
                background: 'var(--driver-primary-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--driver-primary)' }}>Next:</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--driver-text)' }}>{nextStop?.stopName || 'End'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const FullStopsList = () => (
    <div className="stops-list" style={{ display: 'flex', flexDirection: 'column' }}>
      {routeStops.map((stop, index) => {
        const isCompleted = index < currentStopIndex;
        const isActive = index === currentStopIndex;

        return (
          <div
            key={stop._id || index}
            className={`stop-list-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            onClick={() => isActive && handleArrive()}
            style={{ cursor: isActive ? 'pointer' : 'default' }}
          >
            <div className="stop-number">
              {index + 1}
            </div>

            <div className="stop-info">
              <div className="stop-name">{stop.stopName || `Stop ${index + 1}`}</div>
              <div className="stop-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="far fa-clock"></i>
                  {stop.arrivalTime || '08:15 AM'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="fas fa-users"></i>
                  {stop.studentCount || 8}
                </div>
              </div>
            </div>

            {isCompleted && (
              <div className="status-check">
                <i className="fas fa-check-circle"></i>
              </div>
            )}

            {!isCompleted && !isActive && (
              <div className="status-pending" style={{ color: 'var(--driver-border)' }}>
                <i className="far fa-circle"></i>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (compact) {
    return (
      <div className="driver-glass-card" style={{ overflow: 'hidden' }}>
        {/* Current Stop Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '2px solid var(--driver-success)',
          background: 'var(--driver-success-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'var(--driver-success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '14px'
            }}>
              {currentStopIndex + 1}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--driver-text)', fontSize: '15px' }}>{currentStop?.stopName || 'No Stop'}</div>
              <div style={{ fontSize: '12px', color: 'var(--driver-success)' }}>Current Stop</div>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--driver-text-muted)' }}>{completedStops.length}/{routeStops.length}</div>
        </div>

        {/* Action Buttons */}
        {tripState === 'EN_ROUTE' && currentStop && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={handleDepart} disabled={loading} className="driver-btn driver-btn-primary">
              <i className="fas fa-check-circle" style={{ fontSize: '18px' }}></i>
              <span>DEPART FROM STOP</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => setShowSkipModal(true)} disabled={loading} className="driver-btn driver-btn-ghost" style={{ padding: '10px' }}>
                <i className="fas fa-forward"></i>
                <span>Skip</span>
              </button>
              <div style={{
                padding: '10px', borderRadius: 'var(--driver-radius-sm)',
                background: 'var(--driver-primary-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--driver-primary)' }}>Next:</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--driver-text)' }}>{nextStop?.stopName || 'End'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="stop-management-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!compact && (
        <div className="driver-glass-header" style={{ padding: '16px', borderBottom: '1px solid var(--driver-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--driver-text)', margin: 0 }}>Stop Management</h3>
              <p style={{ color: 'var(--driver-text-muted)', fontSize: '13px', margin: '2px 0 0' }}>
                {routeStops.length} stops • {completedStops.length} completed
              </p>
            </div>
          </div>
        </div>
      )}

      <FullStopsList />

      {/* Skip Modal */}
      {showSkipModal && (
        <div className="overlay-wrapper">
          <div className="overlay-backdrop" onClick={() => setShowSkipModal(false)}></div>
          <div className="driver-card overlay-content" style={{ padding: '24px', maxWidth: '340px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--driver-text)', marginBottom: '12px' }}>Skip Stop</h3>
              <p style={{ color: 'var(--driver-text-dim)', marginBottom: '16px' }}>Please provide a reason for skipping this stop:</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {['No students waiting', 'Road blocked', 'Wrong stop', 'Other'].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSkipReason(reason)}
                    className="driver-btn"
                    style={{
                      justifyContent: 'flex-start',
                      border: '1px solid var(--driver-border)',
                      borderColor: skipReason === reason ? 'var(--driver-primary)' : undefined,
                      background: skipReason === reason ? 'var(--driver-primary-dim)' : 'var(--driver-surface-active)',
                      color: skipReason === reason ? 'var(--driver-primary)' : 'var(--driver-text)'
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                value={skipReason === 'Other' ? skipReason : ''}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Or specify other reason..."
                className="driver-textarea"
                rows={2}
                style={{
                  marginBottom: '16px', minHeight: '60px', width: '100%',
                  padding: '12px', borderRadius: '8px', border: '1px solid var(--driver-border)',
                  fontFamily: 'inherit', color: 'var(--driver-text)', background: 'var(--driver-surface-active)'
                }}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { setShowSkipModal(false); setSkipReason(''); }}
                  className="driver-btn driver-btn-ghost"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSkip}
                  disabled={!skipReason || loading}
                  className="driver-btn driver-btn-primary"
                  style={{ flex: 1 }}
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StopManagementPanel;
