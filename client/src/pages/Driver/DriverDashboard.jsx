// AGGRESSIVE DRIVER DASHBOARD - CONTROL CENTER
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/DriverDashboard.css';
import {
  PlayIcon,
  StopIcon,
  ExclamationTriangleIcon,
  MapIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowPathIcon,
  MicrophoneIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  GaugeIcon,
  Bars3Icon,
  HomeIcon,
  TruckIcon,
  RadioIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const TRIP_STATES = {
  NOT_STARTED: 'NOT_STARTED',
  STARTED: 'STARTED',
  EN_ROUTE: 'EN_ROUTE',
  ARRIVED: 'ARRIVED',
  DELAYED: 'DELAYED',
  EMERGENCY: 'EMERGENCY',
  COMPLETED: 'COMPLETED'
};

const DriverDashboard = () => {
  const { user } = useAuth();
  const { socket, connected, sendLocationUpdate } = useSocket();

  // CORE STATE
  const [tripState, setTripState] = useState(TRIP_STATES.NOT_STARTED);
  const [busLocation, setBusLocation] = useState([9.9252, 78.1198]);
  const [speed, setSpeed] = useState(0);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('map');

  // SIDEBAR STATE
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // LAYOUT STATE
  const [analyticsMode, setAnalyticsMode] = useState('none'); // 'none', 'bottom', 'side', 'both'
  const [mapHeight, setMapHeight] = useState('100%');
  const [mapWidth, setMapWidth] = useState('100%');

  // NOTIFICATIONS
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  // SETTINGS
  const [settings, setSettings] = useState({
    darkMode: true,
    accentColor: '#10b981',
    layout: 'comfortable', // 'compact', 'comfortable'
    mapStyle: 'normal', // 'normal', 'satellite', 'dark'
    notificationSound: true,
    sideAnalytics: false
  });

  // BROADCAST STATE
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    sendTo: 'all', // 'driver', 'all'
    timestamp: null
  });

  // ROUTE & STOPS
  const [routeStops, setRouteStops] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [mapCenter, setMapCenter] = useState([9.9252, 78.1198]);
  const [mapZoom, setMapZoom] = useState(15);

  // TRIP METRICS
  const [tripMetrics, setTripMetrics] = useState({
    startTime: null,
    duration: 0,
    distance: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    delayTime: 0,
    stopsCompleted: 0,
    studentCount: 0
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    const initDashboard = async () => {
      if (user) {
        try {
          const bus = await busService.getMyBus();
          if (bus) {
            setBusData(bus);
            // Default location logic
            const lat = bus.latitude || 9.9252;
            const lng = bus.longitude || 78.1198;
            setBusLocation([lat, lng]);

            driverService.initializeDriverSocket(bus.id || bus.busId, user.id);

            // Get Route
            if (bus.routeId) {
              const stopsData = await busService.getRouteStops(bus.routeId);
              if (stopsData && stopsData.stops) {
                const stops = stopsData.stops.map(s => ({
                  ...s,
                  lat: parseFloat(s.latitude),
                  lng: parseFloat(s.longitude)
                }));
                setRouteStops(stops);
                setRoutePath(stops.map(s => [s.lat, s.lng]));
              }
            }
          }
        } catch (err) {
          console.error("Dashboard Init Error:", err);
        }
      }
    };
    initDashboard();

    // Stats Timer
    const timer = setInterval(() => {
      if (tripState === TRIP_STATES.STARTED || tripState === TRIP_STATES.EN_ROUTE || tripState === TRIP_STATES.ARRIVED) {
        setMetrics(prev => ({ ...prev, duration: prev.duration + 1 }));
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [user, tripState]);

  // Screen size watcher (desktop vs mobile)
  useEffect(() => {
    const handleResize = () => setIsDesktop(detectDesktop());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep a secondary panel open on desktop instead of an empty column
  useEffect(() => {
    if (isDesktop && activeTab === 'map') {
      setActiveTab('list');
    }
  }, [isDesktop, activeTab]);

  // --- SOCKET EVENT HANDLERS ---
  const handleStartTrip = () => {
    setTripState(TRIP_STATES.STARTED);
    setMetrics({ ...metrics, startTime: new Date() });
    driverService.startTrip({ routeId: busData?.routeId }, busLocation);
    // Move to En Route
    setTimeout(() => setTripState(TRIP_STATES.EN_ROUTE), 1000);
  };

  const handleArriveStop = () => {
    setTripState(TRIP_STATES.ARRIVED);
    const stop = routeStops[currentStopIndex];
    if (stop) {
      driverService.arrivedAtStop(stop.id, stop);
    }
  };

  const handleDepartStop = () => {
    setTripState(TRIP_STATES.EN_ROUTE);
    const stop = routeStops[currentStopIndex];
    if (stop) {
      driverService.departedFromStop(stop.id, 0, 0);
    }

    // Check if next stop exists
    if (currentStopIndex < routeStops.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
      setMetrics(prev => ({ ...prev, stopsCompleted: prev.stopsCompleted + 1 }));
    } else {
      setTripState(TRIP_STATES.COMPLETED);
    }
  };

  const handleSkipStop = () => {
    if (window.confirm("Confirm Skip Stop?")) {
      const stop = routeStops[currentStopIndex];
      driverService.skipStop(stop.id, "Manual Skip");

      if (currentStopIndex < routeStops.length - 1) {
        setCurrentStopIndex(prev => prev + 1);
      }
    }
  };

  const handlePauseTrip = () => {
    setTripState(TRIP_STATES.DELAYED);
    driverService.pauseTrip("Manual Pause", 5);
  };

  const handleResumeTrip = () => {
    setTripState(TRIP_STATES.EN_ROUTE);
    driverService.resumeTrip();
  };

  const handleEndTrip = () => {
    if (window.confirm("Confim End Trip?")) {
      setTripState(TRIP_STATES.COMPLETED);
      driverService.endTrip(metrics);
    }
  };

  const handleEmergencyTrigger = (type) => {
    setEmergencyActive(true);
    setTripState(TRIP_STATES.EMERGENCY);
    driverService.triggerEmergency(type, "Manual", busLocation);
  };

  const handleEmergencyResolve = () => {
    setEmergencyActive(false);
    setTripState(TRIP_STATES.EN_ROUTE);
    driverService.resolveEmergency("Manual Resolve", "Resolved");
  };

  const handleBroadcast = (msg) => {
    driverService.sendBroadcast(msg);
    setShowBroadcast(false);
  };

  // --- RENDER ---
  return (
    <div className={`driver-dashboard-container ${settings.darkMode ? 'dark-mode' : 'light-mode'} ${emergencyActive ? 'emergency-mode' : ''}`}>

      {/* 1. TOP NAV */}
      <TopNavigationBar
        user={user}
        isConnected={isConnected}
        tripDuration={metrics.duration}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="dashboard-main-area">

        {/* DESKTOP TAB RAIL */}
        {isDesktop && (
          <div className="desktop-tab-rail">
            <div className="tab-rail-label">Control Panels</div>
            <div className="desktop-tab-buttons">
              <button
                className={`desk-tab ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                Stops
              </button>
              <button
                className={`desk-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Stats
              </button>
              <button
                className={`desk-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
              <button
                className="desk-tab ghost"
                onClick={() => setShowBroadcast(true)}
              >
                Alert
              </button>
            </div>
          </div>
        )}

        {/* MAP VIEW */}
        <div className={`view-layer map-layer ${activeTab === 'map' ? 'active' : ''}`}>
          <MapVisualizer
            busLocation={busLocation}
            routePath={routePath}
            stops={routeStops}
            currentStopIndex={currentStopIndex}
            speed={speed}
            settings={settings}
          />
        </div>

        {/* STOP LIST (List View) */}
        {activeTab === 'list' && (
          <div className="view-layer list-layer">
            <StopManager
              stops={routeStops}
              currentStopIndex={currentStopIndex}
            />
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeTab === 'analytics' && (
          <div className="view-layer analytics-layer">
            <DriverAnalytics metrics={metrics} tripState={tripState} />
          </div>
        )}

        {/* SETTINGS VIEW */}
        {activeTab === 'settings' && (
          <div className="view-layer settings-layer">
            <SettingsPanel settings={settings} onUpdateSettings={setSettings} />
          </div>
        )}

      </div>

      {/* 3. BROADCAST PANEL */}
      {showBroadcast && (
        <div className="overlay-wrapper">
          <div className="overlay-backdrop" onClick={() => setShowBroadcast(false)}></div>
          <div className="overlay-content">
            <BroadcastPanel onSendBroadcast={handleBroadcast} onClose={() => setShowBroadcast(false)} />
          </div>
        </div>
      )}

      {/* 4. EMERGENCY OVERLAY */}
      <EmergencyOverlay
        isActive={emergencyActive}
        onTrigger={handleEmergencyTrigger}
        onResolve={handleEmergencyResolve}
        onCancel={() => setEmergencyActive(false)}
      />

      {/* 5. SOS BUTTON */}
      {!emergencyActive && <SOSButton onClick={() => setEmergencyActive(true)} />}

      {/* 6. BOTTOM CONTROL DECK */}
      <div className="bottom-control-deck">
        <TripControls
          tripState={tripState}
          currentStop={routeStops[currentStopIndex]}
          nextStop={routeStops[currentStopIndex]}
          onStartTrip={handleStartTrip}
          onArriveStop={handleArriveStop}
          onDepartStop={handleDepartStop}
          onPauseTrip={handlePauseTrip}
          onResumeTrip={handleResumeTrip}
          onEndTrip={handleEndTrip}
          onSkipStop={handleSkipStop}
        />

        <div className="bottom-nav-tabs">
          <button className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            MAP
          </button>
          <button className={`nav-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            STOPS
          </button>
          <button className={`nav-tab ${showBroadcast ? 'active' : ''}`} onClick={() => setShowBroadcast(!showBroadcast)}>
            ALERT
          </button>
          <button className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            STATS
          </button>
          <button className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
