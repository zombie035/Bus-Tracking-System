// client/src/components/Driver/DriverAnalyticsPanel.jsx
import React, { useMemo } from 'react';
import { useDriver } from '../../contexts/DriverContext';

const DriverAnalyticsPanel = ({ compact = false }) => {
  const {
    analytics,
    tripState,
    tripStartTime,
    routeStops,
    completedStops,
    location
  } = useDriver();

  const tripDuration = useMemo(() => {
    if (!tripStartTime) return '00:00:00';
    const now = new Date();
    const diff = now - new Date(tripStartTime);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [tripStartTime, tripState]);

  const progressPercent = Math.round((completedStops.length / Math.max(routeStops.length, 1)) * 100);

  const stats = useMemo(() => [
    { label: 'Duration', value: tripDuration, icon: 'fa-clock', color: 'var(--driver-primary)' },
    { label: 'Distance', value: `${analytics.totalDistance.toFixed(1)} km`, icon: 'fa-route', color: 'var(--driver-success)' },
    { label: 'Avg Speed', value: `${analytics.averageSpeed.toFixed(1)} km/h`, icon: 'fa-tachometer-alt', color: 'var(--driver-warning)' },
    { label: 'Max Speed', value: `${analytics.maxSpeed.toFixed(1)} km/h`, icon: 'fa-bolt', color: 'var(--driver-danger)' },
    { label: 'Stops Done', value: `${completedStops.length} / ${routeStops.length}`, icon: 'fa-map-pin', color: '#8b5cf6' },
    { label: 'Delay Time', value: `${analytics.delayTime} min`, icon: 'fa-exclamation-triangle', color: 'var(--driver-warning)' }
  ], [analytics, completedStops.length, routeStops.length, tripDuration]);

  if (compact) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {stats.slice(0, 3).map((stat, index) => (
          <div key={index} className="driver-stat-card">
            <div style={{ color: stat.color, fontSize: '16px', marginBottom: '6px' }}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
            <div className="stat-value" style={{ fontSize: '16px' }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="driver-glass-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="driver-glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--driver-border)' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--driver-text)', margin: 0 }}>Trip Analytics</h3>
          <p style={{ color: 'var(--driver-text-muted)', fontSize: '13px', margin: '2px 0 0' }}>Real-time performance metrics</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 900, color: 'var(--driver-success)', letterSpacing: '2px' }}>
            {tripDuration}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--driver-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>ELAPSED</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {stats.map((stat, index) => (
            <div key={index} className="driver-stat-card" style={{ textAlign: 'left', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'var(--driver-surface-active)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <i className={`fas ${stat.icon}`} style={{ color: stat.color, fontSize: '14px' }}></i>
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--driver-text)' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--driver-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Speed Indicator */}
      {location?.speed > 0 && (
        <div style={{
          padding: '16px', borderTop: '1px solid var(--driver-border)',
          background: 'var(--driver-surface-active)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--driver-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Speed</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--driver-text)' }}>
                {location.speed.toFixed(1)} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--driver-text-muted)' }}>km/h</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: location.speed > 60 ? 'var(--driver-danger)' : location.speed > 40 ? 'var(--driver-warning)' : 'var(--driver-success)',
                boxShadow: `0 0 8px ${location.speed > 60 ? 'rgba(239,68,68,0.5)' : location.speed > 40 ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)'}`
              }}></div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--driver-text-dim)' }}>
                {location.speed > 60 ? 'FAST' : location.speed > 40 ? 'NORMAL' : 'SLOW'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--driver-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--driver-text-dim)' }}>Trip Progress</span>
          <span style={{ fontSize: '13px', color: 'var(--driver-text-muted)' }}>{progressPercent}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'var(--driver-surface-active)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--driver-success)', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--driver-text-muted)' }}>Start</span>
          <span style={{ fontSize: '11px', color: 'var(--driver-text-muted)' }}>{completedStops.length} stops completed</span>
          <span style={{ fontSize: '11px', color: 'var(--driver-text-muted)' }}>End</span>
        </div>
      </div>
    </div>
  );
};

export default DriverAnalyticsPanel;
