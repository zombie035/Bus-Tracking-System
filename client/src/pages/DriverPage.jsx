// client/src/pages/DriverPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useDriver, TRIP_STATES } from '../contexts/DriverContext';
import MapComponent from '../components/Common/MapComponent';
import useGeolocation from '../hooks/useGeolocation';
import { busService } from '../services/busService';

// Driver Dashboard CSS
import '../styles/DriverDashboard.css';

// New Driver Dashboard Components
import TripControlPanel from '../components/Driver/TripControlPanel';
import StopManagementPanel from '../components/Driver/StopManagementPanel';
import DriverAnalyticsPanel from '../components/Driver/DriverAnalyticsPanel';
import DriverSettings from '../components/Driver/DriverSettings';
import BroadcastPanel from '../components/Driver/BroadcastPanel';
import EmergencyButton from '../components/Driver/EmergencyButton';
import DriverBottomNav from '../components/Driver/DriverBottomNav';
import AssignedRouteCard from '../components/Driver/AssignedRouteCard';
import NotificationsPanel from '../components/Driver/NotificationsPanel';
import StudentPickupList from '../components/Driver/StudentPickupList';

// Map helper component for auto-zoom
const MapControls = ({ location, speed, settings }) => {
  const map = useMap();

  useEffect(() => {
    if (location && settings?.routeLock) {
      // Auto-zoom based on speed
      let zoom = 15;
      if (speed > 60) {
        zoom = 13; // Zoom out at high speed
      } else if (speed > 40) {
        zoom = 14;
      } else if (speed < 10) {
        zoom = 16; // Zoom in at low speed
      }
      map.setView([location.latitude, location.longitude], zoom);
    }
  }, [location, speed, settings?.routeLock, map]);

  return null;
};

const DriverDashboard = () => {
  const { user } = useAuth();
  const { socket, connected, sendLocationUpdate } = useSocket();
  const driverContext = useDriver();

  // Get variables from context first
  const tripState = driverContext.tripState || 'NOT_STARTED';
  const routeStops = driverContext.routeStops || [];
  const routePath = driverContext.routePath || [];
  const bus = driverContext.bus || null;
  const currentStopIndex = driverContext.currentStopIndex || 0;
  const analytics = driverContext.analytics || { totalDistance: 0, averageSpeed: 0, maxSpeed: 0, delayTime: 0, stopsCompleted: 0 };
  const settings = driverContext.settings || {};
  const studentCount = driverContext.studentCount || 0;
  const layoutConfig = settings?.layoutConfig || {};

  const {
    location: driverLocation,
    error: locationError,
    startTracking,
    stopTracking,
    isTracking,
    getCurrentPosition
  } = useGeolocation();

  // Local state
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(layoutConfig?.bottomSheetDefault !== 'collapsed');

  // Sync expanded state if settings change
  useEffect(() => {
    if (layoutConfig?.bottomSheetDefault) {
      setIsSheetExpanded(layoutConfig.bottomSheetDefault !== 'collapsed');
    }
  }, [layoutConfig?.bottomSheetDefault]);

  // Sync layout settings to body classes for CSS application
  useEffect(() => {
    const body = document.body;

    // Theme logic
    const isDark = layoutConfig.theme === 'dark' || (layoutConfig.theme === 'auto' && new Date().getHours() >= 18);
    const isHighContrast = layoutConfig.theme === 'high-contrast';

    body.classList.toggle('dark-mode', isDark && !isHighContrast);
    body.classList.toggle('high-contrast-mode', isHighContrast);

    // Density
    body.classList.remove('density-comfortable', 'density-compact', 'density-large');
    body.classList.add(`density-${layoutConfig.density || 'comfortable'}`);

    // Nav Position
    body.classList.remove('nav-pos-bottom', 'nav-pos-top', 'nav-pos-floating', 'nav-pos-sidebar');
    body.classList.add(`nav-pos-${layoutConfig.navbarPosition || 'bottom'}`);

    // Nav Style
    body.classList.remove('nav-style-icons-labels', 'nav-style-icons', 'nav-style-compact', 'nav-style-large');
    body.classList.add(`nav-style-${layoutConfig.navStyle || 'icons-labels'}`);

    // Map Controls
    body.classList.remove('map-controls-left', 'map-controls-right');
    body.classList.add(`map-controls-${layoutConfig.mapControls || 'right'}`);

    // Emergency Position
    body.classList.remove('emergency-pos-top-right', 'emergency-pos-floating-bottom', 'emergency-pos-fixed-bottom');
    body.classList.add(`emergency-pos-${layoutConfig.emergencyPosition || 'top-right'}`);

    return () => {
      // Body cleanup on unmount
      body.classList.remove(
        'dark-mode', 'high-contrast-mode',
        'density-comfortable', 'density-compact', 'density-large',
        'nav-pos-bottom', 'nav-pos-top', 'nav-pos-floating', 'nav-pos-sidebar',
        'nav-style-icons-labels', 'nav-style-icons', 'nav-style-compact', 'nav-style-large',
        'map-controls-left', 'map-controls-right',
        'emergency-pos-top-right', 'emergency-pos-floating-bottom', 'emergency-pos-fixed-bottom'
      );
    };
  }, [layoutConfig]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const busData = await busService.getMyBus();

        if (busData.success && busData.bus) {
          // Data loaded
        } else {
          showToast(busData.message || 'No bus assigned', 'error');
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get initial GPS location
  useEffect(() => {
    const getInitialLocation = async () => {
      if (!driverLocation && !locationError) {
        try {
          const currentPos = await getCurrentPosition();
        } catch (error) {
          console.error('Failed to get initial location:', error);
        }
      }
    };

    getInitialLocation();
  }, [driverLocation, locationError, getCurrentPosition]);

  // Trip handlers using driver context
  const handleStartTrip = async () => {
    const result = await driverContext.startTrip();
    if (result.success) {
      const watchId = startTracking(driverContext.updateLocation);
      showToast('Trip started successfully', 'success');
    } else {
      showToast(result.message || 'Failed to start trip', 'error');
    }
  };

  const handleEndTrip = async () => {
    stopTracking();
    const result = await driverContext.endTrip();
    if (result.success) {
      showToast('Trip ended successfully', 'success');
    } else {
      showToast(result.message || 'Failed to end trip', 'error');
    }
  };

  const handleEmergency = async (alertData) => {
    try {
      const response = await busService.sendEmergencyAlert(alertData);
      if (response.success) {
        showToast('🚨 Emergency alert sent!', 'success');
      } else {
        showToast('Failed to send alert', 'error');
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      showToast('Error sending alert', 'error');
    }
  };

  const handleDelayReport = async (delayData) => {
    try {
      const response = await busService.reportDelay(delayData);
      if (response.success) {
        showToast('Delay reported!', 'success');
        setShowDelayModal(false);
      }
    } catch (error) {
      console.error('Error reporting delay:', error);
    }
  };

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Get current location for map
  const currentLocation = driverLocation || { latitude: 20.5937, longitude: 78.9629 };

  // Create map markers with stop status (Image-matched style)
  const mapMarkers = useMemo(() => {
    const markers = [];

    // Bus location marker
    if (driverLocation) {
      markers.push({
        position: { lat: driverLocation.latitude, lng: driverLocation.longitude },
        iconHtml: `
          <div style="
            width: 40px;
            height: 40px;
            background: var(--driver-primary);
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 4px 15px rgba(0, 71, 255, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
          ">
            <i class="fas fa-bus"></i>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popup: `<strong>Your Bus</strong>`
      });
    }

    // Route stops with status (Dots from image)
    routeStops.forEach((stop, index) => {
      const isCompleted = index < currentStopIndex;
      const isActive = index === currentStopIndex;

      let markerHtml;
      if (isActive) {
        markerHtml = `
          <div style="
            width: 24px;
            height: 24px;
            background: white;
            border-radius: 50%;
            border: 4px solid var(--driver-warning);
            box-shadow: 0 0 10px var(--driver-warning);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: var(--driver-warning); border-radius: 50%;"></div>
          </div>
        `;
      } else if (isCompleted) {
        markerHtml = `
          <div style="width: 12px; height: 12px; background: var(--driver-neutral); border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
        `;
      } else {
        markerHtml = `
          <div style="width: 12px; height: 12px; background: var(--driver-primary); border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
        `;
      }

      markers.push({
        position: { lat: stop.latitude, lng: stop.longitude },
        iconHtml: markerHtml,
        iconSize: [isActive ? 24 : 12, isActive ? 24 : 12],
        iconAnchor: [isActive ? 12 : 6, isActive ? 12 : 6],
        popup: `<strong>${stop.stopName || 'Stop'}</strong>`
      });
    });

    return markers;
  }, [driverLocation, routeStops, currentStopIndex, tripState]);

  // Get trip status badge class
  const getTripBadgeClass = () => {
    switch (tripState) {
      case TRIP_STATES.EN_ROUTE: return 'en-route';
      case TRIP_STATES.DELAYED: return 'delayed';
      case TRIP_STATES.EMERGENCY: return 'emergency';
      case TRIP_STATES.COMPLETED: return 'completed';
      default: return 'ready';
    }
  };

  const getTripLabel = () => {
    switch (tripState) {
      case TRIP_STATES.NOT_STARTED: return 'READY';
      case TRIP_STATES.EN_ROUTE: return 'ON TRIP';
      case TRIP_STATES.DELAYED: return 'DELAYED';
      case TRIP_STATES.EMERGENCY: return 'EMERGENCY';
      case TRIP_STATES.COMPLETED: return 'COMPLETED';
      default: return 'UNKNOWN';
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        const completedPath = routeStops.slice(0, currentStopIndex + 1).map(s => ({ lat: s.latitude, lng: s.longitude }));
        const remainingPath = routeStops.slice(currentStopIndex).map(s => ({ lat: s.latitude, lng: s.longitude }));

        return (
          <div style={{ height: '100%', width: '100%' }}>
            {/* Map */}
            <div className="driver-map-container" style={{ height: '100%', width: '100%', position: 'relative' }}>
              <MapComponent
                center={[currentLocation.latitude, currentLocation.longitude]}
                zoom={15}
                markers={mapMarkers}
                routes={[]}
                interactive={true}
              >
                {/* Completed Path (Blue) */}
                {completedPath.length > 1 && (
                  <Polyline
                    positions={completedPath}
                    color="var(--driver-primary)"
                    weight={6}
                    opacity={0.9}
                  />
                )}
                {/* Remaining Path (Gray) */}
                {remainingPath.length > 1 && (
                  <Polyline
                    positions={remainingPath}
                    color="var(--driver-border)"
                    weight={6}
                    opacity={0.6}
                    dashArray="10, 10"
                  />
                )}

                {routePath.length > 0 && (
                  <Polyline
                    positions={routePath}
                    color="var(--driver-primary)"
                    weight={4}
                    opacity={0.4}
                  />
                )}
                <MapControls location={driverLocation} speed={driverLocation?.speed} settings={settings} />
              </MapComponent>

              {locationError && (
                <div style={{
                  position: 'absolute', top: '12px', left: '12px', right: '12px',
                  background: 'rgba(239, 68, 68, 0.9)', backdropFilter: 'blur(12px)',
                  borderRadius: '12px', padding: '12px 16px', zIndex: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>Location Error</div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>{locationError}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Map Quick Stats Overlay */}
              <div className="driver-map-stats">
                <div className="driver-map-stat">
                  <div className="stat-val">{studentCount}</div>
                  <div className="stat-lbl">Students</div>
                </div>
                <div className="driver-map-stat">
                  <div className="stat-val">{currentStopIndex + 1}/{routeStops.length}</div>
                  <div className="stat-lbl">Stop</div>
                </div>
                <div className="driver-map-stat">
                  <div className="stat-val">{driverLocation?.speed?.toFixed(0) || 0}</div>
                  <div className="stat-lbl">km/h</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'trip':
        const tripControlsFloating = layoutConfig.tripControls === 'floating';
        return (
          <div className={tripControlsFloating ? 'trip-controls-floating' : 'desktop-grid-2'}>
            <div className={tripControlsFloating ? 'floating-trip-panel' : ''}>
              <TripControlPanel />
              {tripState === TRIP_STATES.EN_ROUTE && (
                <div style={{ marginTop: '16px' }}>
                  <StopManagementPanel />
                </div>
              )}
            </div>

            {!tripControlsFloating && (
              <div>
                <AssignedRouteCard />
              </div>
            )}
          </div>
        );

      case 'broadcast':
        return (
          <div className="desktop-grid-2">
            <BroadcastPanel />
            <NotificationsPanel />
          </div>
        );

      case 'analytics':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <DriverAnalyticsPanel />

            <div className="driver-glass-card" style={{ padding: '20px' }}>
              <div className="driver-section-header">
                <i className="fas fa-users" style={{ color: 'var(--driver-primary)' }}></i>
                <span>Live Tracking</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="driver-stat-card">
                  <div className="stat-value highlight-text">{studentCount}</div>
                  <div className="stat-label">Active Students</div>
                </div>
                <div className="driver-stat-card">
                  <div className="stat-value" style={{ color: 'var(--driver-success)' }}>{currentStopIndex}</div>
                  <div className="stat-label">Stops Done</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <DriverSettings />
          </div>
        );

      case 'profile':
        return (
          <div className="desktop-grid-2">
            {/* Profile Card */}
            <div>
              <div className="driver-glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--driver-primary), var(--driver-purple))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '24px', fontWeight: 800, flexShrink: 0
                  }}>
                    {user?.name?.charAt(0).toUpperCase() || 'D'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--driver-text)', margin: 0 }}>{user?.name}</h3>
                    <p style={{ color: 'var(--driver-text-dim)', fontSize: '14px', margin: '4px 0' }}>{user?.email}</p>
                    <p style={{ color: 'var(--driver-text-muted)', fontSize: '13px', margin: 0 }}>Driver ID: {user?.driverId || 'N/A'}</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--driver-border)', paddingTop: '16px' }}>
                  <div className="driver-section-header">
                    <i className="fas fa-signal" style={{ color: connected ? 'var(--driver-success)' : 'var(--driver-danger)' }}></i>
                    <span>Connection</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: connected ? 'var(--driver-success)' : 'var(--driver-danger)',
                      boxShadow: connected ? '0 0 8px rgba(16,185,129,0.5)' : 'none'
                    }}></div>
                    <span style={{ color: 'var(--driver-text-dim)', fontWeight: 600 }}>
                      {connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <StudentPickupList />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--driver-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="driver-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--driver-text-muted)', fontSize: '14px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-dashboard">
      <div className="driver-sidebar-wrapper">
        <DriverBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="driver-main-content" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
        {renderContent()}

        {/* Floating Bottom Actions (from image) */}
        <div className="bottom-actions-floating">
          <button className="map-control-btn" style={{ background: 'white', borderRadius: '100px', width: 'auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-mobile-alt" style={{ color: '#6366F1' }}></i>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Switch to Mobile</span>
          </button>
          <button onClick={() => handleDelayReport({})} className="driver-btn driver-btn-warning" style={{ borderRadius: '100px', padding: '0 24px', height: '44px', border: 'none' }}>
            Delay
          </button>
          <button className="map-control-btn" style={{ background: 'white', borderRadius: '100px', width: 'auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-file-alt" style={{ color: '#94A3B8' }}></i>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>Report Issue</span>
          </button>
        </div>

        {/* Map Quick Stats Overlays are handled inside renderContent for now, but following image style */}
      </div>

      {activeTab === 'map' && (
        <div className="driver-operational-panel">
          {/* Operational Header - Route Info (from image) */}
          <div className="driver-glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--driver-text)', margin: 0 }}>
                  {bus?.routeName || 'Route 42 - North District'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--driver-success)', fontSize: '12px', fontWeight: 700, marginTop: '4px' }}>
                  <div style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%' }}></div>
                  Active
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => handleDelayReport({})}
                className="driver-btn driver-btn-warning"
                style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: 'none' }}
              >
                Pause
              </button>
              <button
                onClick={() => handleEndTrip()}
                className="driver-btn driver-btn-danger"
                style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: 'none' }}
              >
                End Trip
              </button>
            </div>
          </div>

          {/* Next Stop Summary (from image) */}
          <div className="driver-glass-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '10px', color: 'var(--driver-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Next Stop
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--driver-text)', margin: '0 0 16px' }}>
              {routeStops[currentStopIndex + 1]?.stopName || 'Washington Square'}
            </h2>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--driver-primary)', fontWeight: 700 }}>
                <i className="fas fa-location-arrow" style={{ transform: 'rotate(45deg)' }}></i>
                <span>0.8 km</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--driver-text)', fontWeight: 700 }}>
                <i className="far fa-clock"></i>
                <span>{routeStops[currentStopIndex + 1]?.arrivalTime || '08:38 AM'}</span>
              </div>
            </div>

            <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(currentStopIndex / routeStops.length) * 100}%`,
                  height: '100%',
                  background: 'var(--driver-primary)',
                  borderRadius: '4px'
                }}
              ></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', fontWeight: 700, color: 'var(--driver-text-muted)' }}>
              <span>{currentStopIndex} of {routeStops.length} stops</span>
              <span style={{ color: 'var(--driver-primary)' }}>{Math.round((currentStopIndex / routeStops.length) * 100)}%</span>
            </div>
          </div>

          {/* All Stops List (from image) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ fontSize: '12px', color: 'var(--driver-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              All Stops
            </div>
            <div className="driver-glass-card" style={{ flex: 1, overflowY: 'auto' }}>
              <StopManagementPanel isDashboardView={true} />
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`driver-toast ${toast.type}`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' :
            toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
            }`}></i>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
