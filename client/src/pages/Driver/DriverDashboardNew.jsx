// AGGRESSIVE DRIVER DASHBOARD - CONTROL CENTER
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/DriverDashboardNew.css';
import routeService from '../../services/routeService';
import driverService from '../../services/driverService';
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
  BeakerIcon,
  Bars3Icon,
  TruckIcon,
  RadioIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  CogIcon
} from '@heroicons/react/24/outline';

// TRIP LIFECYCLE STATES
const TRIP_STATES = {
  NOT_STARTED: 'NOT_STARTED',
  STARTED: 'STARTED',
  EN_ROUTE: 'EN_ROUTE',
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
  const [loading, setLoading] = useState(false);
  
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
  const [assignedStops, setAssignedStops] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [mapCenter, setMapCenter] = useState([9.9252, 78.1198]);
  const [mapZoom, setMapZoom] = useState(15);
  
  // DRIVER PROFILE & BUS DETAILS
  const [busDetails, setBusDetails] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  
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

  // Navigation items
  const navigationItems = [
    { id: 'map', name: 'Live Map', icon: MapIcon, description: 'Real-time bus tracking' },
    { id: 'trip', name: 'Trip Control', icon: TruckIcon, description: 'Manage trip lifecycle' },
    { id: 'broadcast', name: 'Broadcast', icon: RadioIcon, description: 'Send messages to students' },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, description: 'Trip performance metrics' },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, description: 'Driver preferences' },
    { id: 'profile', name: 'Profile', icon: UserCircleIcon, description: 'Driver information' }
  ];

  // Handle navigation
  const handleNavigation = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  // Layout management
  const toggleAnalytics = (mode) => {
    setAnalyticsMode(mode);
    
    switch(mode) {
      case 'bottom':
        setMapHeight('60%');
        setMapWidth('100%');
        break;
      case 'side':
        setMapHeight('100%');
        setMapWidth('70%');
        break;
      case 'both':
        setMapHeight('60%');
        setMapWidth('70%');
        break;
      default:
        setMapHeight('100%');
        setMapWidth('100%');
    }
  };

  // Notification handling
  const handleNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    setNotificationCount(prev => prev + 1);
    setShowNotificationPopup(true);
    
    // Play sound if enabled
    if (settings.notificationSound) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Auto-hide popup after 5 seconds
    setTimeout(() => setShowNotificationPopup(false), 5000);
  }, [settings.notificationSound]);

  // Fetch driver-specific stops based on assigned bus
  const fetchDriverStops = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🚀 fetchDriverStops called!');
      console.log('🔍 User object:', user);
      
      // Get driver info from authenticated user
      const driverId = user?.id;
      const driverPhone = user?.phone;
      
      // Use real database bus number (no fallbacks)
      let busNumber = user?.bus_assigned || user?.busAssigned;
      
      console.log('🚌 Driver Info:', { driverId, driverPhone, busNumber });
      
      if (!busNumber) {
        console.log('❌ No bus assigned to driver');
        setLoading(false);
        return;
      }
      
      console.log('🔍 Fetching stops for bus:', busNumber);
      
      // Try to fetch real route stops from database
      const result = await routeService.getRouteStopsByBus(busNumber);
      
      console.log('📡 Route service result:', result);
      
      let driverStops = result.stops;
      
      // If API call failed, use mock data from service
      if (!result.success) {
        console.log('⚠️ Using mock data due to API failure');
        driverStops = routeService.getMockStopsForBus(busNumber);
      }
      
      console.log('📍 Raw stops from API:', driverStops);
      
      // Enrich stops with additional data
      const enrichedStops = driverStops.map(stop => ({
        ...stop,
        status: 'upcoming',
        eta: calculateETA(stop),
        passengers: Math.floor(Math.random() * 20) + 5,
        lastUpdated: new Date().toISOString()
      }));
      
      console.log('✨ Enriched stops:', enrichedStops);
      
      setAssignedStops(enrichedStops);
      setRouteStops(enrichedStops);
      const newPath = enrichedStops.map(stop => [stop.lat, stop.lng]);
      setRoutePath(newPath);
      
      console.log('🗺️ Route Path set:', newPath);
      console.log('📍 Route Stops set:', enrichedStops);
      
      if (enrichedStops.length > 0) {
        setMapCenter([enrichedStops[0].lat, enrichedStops[0].lng]);
      }
      
      console.log(`✅ Loaded ${enrichedStops.length} stops for bus ${busNumber}`);
      console.log('📍 Final stops loaded:', enrichedStops);
      
    } catch (error) {
      console.error('❌ Error fetching driver stops:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch bus details by driver name
  const fetchBusDetails = useCallback(async () => {
    try {
      const driverId = user?.id;
      const driverName = user?.name;
      
      if (!driverId && !driverName) {
        console.log('⚠️ No driver ID or name available');
        return;
      }

      let result;
      
      // Try to fetch by driver ID first (more reliable)
      if (driverId) {
        result = await driverService.getBusDetailsByDriverId(driverId);
      } else if (driverName) {
        result = await driverService.getBusDetailsByDriver(driverName);
      }

      if (result.success) {
        console.log('✅ Bus details retrieved:', result.busDetails);
        setBusDetails(result.busDetails);
        setDriverProfile(result.driverInfo);
      } else {
        console.log('⚠️ Using mock data due to API failure');
        const mockBusDetails = driverService.getMockBusDetails(driverName);
        setBusDetails(mockBusDetails);
      }

      // Also fetch real-time bus data
      const busNumber = user?.bus_assigned || user?.busAssigned;
      if (busNumber) {
        const realTimeResult = await driverService.getBusRealTimeData(busNumber);
        if (realTimeResult.success) {
          console.log('📡 Real-time bus data:', realTimeResult.busData);
          // Update bus details with real-time data
          setBusDetails(prev => ({
            ...prev,
            ...realTimeResult.busData
          }));
        }
      }

    } catch (error) {
      console.error('❌ Error fetching bus details:', error);
    }
  }, [user]);

  // Initialize driver data
  useEffect(() => {
    fetchDriverStops();
    fetchBusDetails();
  }, [fetchDriverStops, fetchBusDetails]);

  // Get current bus number from database (no forced values)
  const currentBusNumber = busDetails?.busNumber || user?.bus_assigned || user?.busAssigned;

  // Debug route stops changes
  useEffect(() => {
    console.log('🔍 Route stops updated:', routeStops);
    console.log('🗺️ Route path updated:', routePath);
  }, [routeStops, routePath]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('admin-notification', handleNotification);
    socket.on('emergency-alert', handleNotification);
    socket.on('route-update', (data) => {
      if (data.routePath) setRoutePath(data.routePath);
      if (data.stops) setRouteStops(data.stops);
    });

    return () => {
      socket.off('admin-notification');
      socket.off('emergency-alert');
      socket.off('route-update');
    };
  }, [socket, handleNotification]);

  // Location tracking
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate location updates
      setBusLocation(prev => [
        prev[0] + (Math.random() - 0.5) * 0.001,
        prev[1] + (Math.random() - 0.5) * 0.001
      ]);
      setSpeed(prev => Math.max(0, prev + (Math.random() - 0.5) * 10));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Settings persistence
  useEffect(() => {
    localStorage.setItem('driverSettings', JSON.stringify(settings));
  }, [settings]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('driverSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Trip controls
  const startTrip = () => {
    setTripState(TRIP_STATES.STARTED);
    setTripMetrics(prev => ({ ...prev, startTime: new Date() }));
    
    socket?.emit('trip-start', {
      driverId: user?.id,
      timestamp: new Date()
    });
  };

  const endTrip = () => {
    setTripState(TRIP_STATES.COMPLETED);
    
    socket?.emit('trip-end', {
      driverId: user?.id,
      timestamp: new Date(),
      metrics: tripMetrics
    });
  };

  const arriveAtStop = (stopIndex) => {
    const updatedStops = [...routeStops];
    updatedStops[stopIndex].status = 'reached';
    setRouteStops(updatedStops);
    setCurrentStopIndex(stopIndex);
    
    socket?.emit('stop-arrived', {
      stopId: updatedStops[stopIndex].id,
      timestamp: new Date()
    });
  };

  const departFromStop = (stopIndex) => {
    const updatedStops = [...routeStops];
    updatedStops[stopIndex].status = 'completed';
    setRouteStops(updatedStops);
    setCurrentStopIndex(stopIndex + 1);
    
    socket?.emit('stop-departed', {
      stopId: updatedStops[stopIndex].id,
      timestamp: new Date()
    });
  };

  const skipStop = (stopIndex) => {
    const updatedStops = [...routeStops];
    updatedStops[stopIndex].status = 'skipped';
    setRouteStops(updatedStops);
    
    socket?.emit('stop-skipped', {
      stopId: updatedStops[stopIndex].id,
      reason: 'Driver decision',
      timestamp: new Date()
    });
  };

  const triggerEmergency = (type) => {
    setTripState(TRIP_STATES.EMERGENCY);
    
    socket?.emit('emergency-trigger', {
      type,
      driverId: user?.id,
      location: busLocation,
      timestamp: new Date()
    });
  };

  const sendBroadcast = () => {
    socket?.emit('driver-broadcast', {
      ...broadcastData,
      driverId: user?.id,
      timestamp: new Date()
    });
    
    setBroadcastData({ title: '', message: '', sendTo: 'all' });
  };

  // Custom icons
  const busIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const stopIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const currentStopIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  const completedStopIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  // Map tile URLs
  const getMapTileUrl = () => {
    switch(settings.mapStyle) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="map-layout">
            {/* Driver Dashboard Panel */}
            <div className="driver-panel">
              <div className="panel-header">
                <h3>Driver Dashboard</h3>
                <div className="connection-status">
                  <div className={`status-dot ${connected ? 'online' : 'offline'}`}></div>
                  <span>{connected ? 'Connected' : 'Offline'}</span>
                </div>
              </div>
              
              <div className="driver-info">
                <div className="info-item">
                  <UserCircleIcon className="w-5 h-5" />
                  <span>{user?.name || 'Driver'}</span>
                </div>
                <div className="info-item">
                  <TruckIcon className="w-5 h-5" />
                  <span>Bus {user?.busNumber || '001'}</span>
                </div>
                <div className="info-item">
                  <BeakerIcon className="w-5 h-5" />
                  <span>{speed.toFixed(1)} km/h</span>
                </div>
              </div>

              {/* Start Trip Button */}
              {tripState === TRIP_STATES.NOT_STARTED && (
                <div className="trip-start-section">
                  <button onClick={startTrip} className="btn btn-primary btn-large">
                    <PlayIcon className="w-6 h-6" />
                    Start Trip
                  </button>
                </div>
              )}

              <div className="route-status">
                <h4>Route Status</h4>
                <div className="status-item">
                  <span className="label">Trip State:</span>
                  <span className={`value ${tripState.toLowerCase()}`}>{tripState.replace('_', ' ')}</span>
                </div>
                <div className="status-item">
                  <span className="label">Current Stop:</span>
                  <span className="value">{currentStopIndex + 1}/{routeStops.length}</span>
                </div>
                <div className="status-item">
                  <span className="label">Stops Completed:</span>
                  <span className="value">{tripMetrics.stopsCompleted}</span>
                </div>
              </div>

              <div className="notifications-panel">
                <h4>Notifications</h4>
                <div className="notification-badge">
                  <BellIcon className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="badge">{notificationCount}</span>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.slice(0, 3).map((notif, index) => (
                    <div key={index} className="notification-item">
                      <span className="notification-time">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                      <span className="notification-message">{notif.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="map-section">
              <div className="map-container" style={{ height: mapHeight, width: mapWidth }}>
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url={getMapTileUrl()}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Bus Location */}
                  <Marker position={busLocation} icon={busIcon}>
                    <Popup>
                      <div className="popup-content">
                        <strong>Bus Location</strong><br />
                        Bus: {currentBusNumber}<br />
                        Driver: {user?.name || 'N/A'}<br />
                        Phone: {user?.phone || 'N/A'}<br />
                        Speed: {speed.toFixed(1)} km/h<br />
                        Status: {tripState.replace('_', ' ')}<br />
                        Route: {assignedStops.length} stops assigned
                      </div>
                    </Popup>
                  </Marker>

                  {/* Route Path */}
                  <Polyline
                    positions={routePath}
                    color={settings.accentColor}
                    weight={4}
                    opacity={0.8}
                  />

                  {/* Stop Markers */}
                  {console.log('🗺️ About to render stops. routeStops length:', routeStops.length)}
                  {routeStops.length === 0 && (
                    <div style={{position: 'absolute', top: '50%', left: '50%', background: 'red', color: 'white', padding: '10px'}}>
                      NO STOPS TO RENDER
                    </div>
                  )}
                  {routeStops.map((stop, index) => {
                    console.log(`📍 Rendering stop ${index}:`, stop);
                    console.log(`📍 Stop coordinates:`, [stop.lat, stop.lng]);
                    return (
                      <Marker
                        key={stop.id}
                        position={[stop.lat, stop.lng]}
                        icon={
                          index === currentStopIndex ? currentStopIcon :
                          stop.status === 'completed' ? completedStopIcon :
                          stopIcon
                        }
                      >
                        <Popup>
                          <div className="popup-content">
                            <strong>{stop.name}</strong><br />
                            Bus: {stop.busNumber}<br />
                            Order: #{stop.order}<br />
                            Status: {stop.status}<br />
                            ETA: {stop.eta}<br />
                            Driver: {user?.name}<br />
                            {index === currentStopIndex && (
                              <div className="stop-actions">
                                <button 
                                  onClick={() => departFromStop(index)}
                                  className="btn btn-small btn-success"
                                >
                                  Depart
                                </button>
                                <button 
                                  onClick={() => skipStop(index)}
                                  className="btn btn-small btn-warning"
                                >
                                  Skip
                                </button>
                              </div>
                            )}
                            {index === currentStopIndex + 1 && (
                              <button 
                                onClick={() => arriveAtStop(index)}
                                className="btn btn-small btn-primary"
                              >
                                Arrive
                              </button>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Stops Panel */}
              <div className="stops-panel">
                <div className="stops-header">
                  <h4>Route Stops - Bus {currentBusNumber}</h4>
                  <div className="stops-count">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{assignedStops.length} stops</span>
                  </div>
                </div>
                <div className="driver-info-compact">
                  <span className="driver-name">{user?.name || 'Driver'}</span>
                  <span className="driver-phone">{user?.phone || 'N/A'}</span>
                </div>
                <div className="stops-list">
                  {assignedStops.map((stop, index) => (
                    <div 
                      key={stop.id} 
                      className={`stop-item ${stop.status === 'completed' ? 'completed' : ''} ${index === currentStopIndex ? 'current' : ''}`}
                    >
                      <div className="stop-info">
                        <div className="stop-number">#{stop.order}</div>
                        <div className="stop-details">
                          <div className="stop-name">{stop.name}</div>
                          <div className="stop-eta">ETA: {stop.eta}</div>
                        </div>
                      </div>
                      <div className="stop-status">
                        {stop.status === 'completed' && <CheckCircleIcon className="w-4 h-4 text-green" />}
                        {stop.status === 'upcoming' && <ClockIcon className="w-4 h-4 text-blue" />}
                        {stop.status === 'reached' && <MapPinIcon className="w-4 h-4 text-red" />}
                        {stop.status === 'skipped' && <XMarkIcon className="w-4 h-4 text-orange" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'trip':
        return (
          <div className="trip-control-panel">
            <h3>Trip Control</h3>
            <div className="trip-status">
              <span className={`status-badge ${tripState.toLowerCase()}`}>
                {tripState.replace('_', ' ')}
              </span>
            </div>
            <div className="control-buttons">
              {tripState === TRIP_STATES.NOT_STARTED && (
                <button onClick={startTrip} className="btn btn-primary">
                  <PlayIcon className="w-5 h-5" />
                  Start Trip
                </button>
              )}
              {(tripState === TRIP_STATES.STARTED || tripState === TRIP_STATES.EN_ROUTE) && (
                <button onClick={endTrip} className="btn btn-danger">
                  <StopIcon className="w-5 h-5" />
                  End Trip
                </button>
              )}
            </div>
          </div>
        );

      case 'broadcast':
        return (
          <div className="broadcast-panel">
            <h3>Broadcast Message</h3>
            <div className="broadcast-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter message title"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your message"
                  className="form-textarea"
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Send To</label>
                <select
                  value={broadcastData.sendTo}
                  onChange={(e) => setBroadcastData(prev => ({ ...prev, sendTo: e.target.value }))}
                  className="form-select"
                >
                  <option value="all">All</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
              <button onClick={sendBroadcast} className="btn btn-primary">
                <RadioIcon className="w-5 h-5" />
                Send Broadcast
              </button>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="analytics-panel">
            <h3>Trip Analytics</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <ClockIcon className="w-8 h-8" />
                <div className="metric-value">{tripMetrics.duration} min</div>
                <div className="metric-label">Duration</div>
              </div>
              <div className="metric-card">
                <BeakerIcon className="w-8 h-8" />
                <div className="metric-value">{tripMetrics.averageSpeed} km/h</div>
                <div className="metric-label">Avg Speed</div>
              </div>
              <div className="metric-card">
                <MapPinIcon className="w-8 h-8" />
                <div className="metric-value">{tripMetrics.stopsCompleted}</div>
                <div className="metric-label">Stops Completed</div>
              </div>
              <div className="metric-card">
                <UserGroupIcon className="w-8 h-8" />
                <div className="metric-value">{tripMetrics.studentCount}</div>
                <div className="metric-label">Students</div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="settings-panel">
            <h3>Settings</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label>Dark Mode</label>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                  className={`toggle-btn ${settings.darkMode ? 'active' : ''}`}
                >
                  {settings.darkMode ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
              </div>
              <div className="setting-item">
                <label>Map Style</label>
                <select
                  value={settings.mapStyle}
                  onChange={(e) => setSettings(prev => ({ ...prev, mapStyle: e.target.value }))}
                  className="form-select"
                >
                  <option value="normal">Normal</option>
                  <option value="satellite">Satellite</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Layout</label>
                <select
                  value={settings.layout}
                  onChange={(e) => setSettings(prev => ({ ...prev, layout: e.target.value }))}
                  className="form-select"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Notification Sound</label>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, notificationSound: !prev.notificationSound }))}
                  className={`toggle-btn ${settings.notificationSound ? 'active' : ''}`}
                >
                  {settings.notificationSound ? '🔊' : '🔇'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="profile-panel">
            <h3>Driver Profile & Bus Details</h3>
            
            {/* Driver Information */}
            <div className="profile-section">
              <h4>👤 Driver Information</h4>
              <div className="profile-info">
                <div className="avatar">
                  <UserCircleIcon className="w-16 h-16" />
                </div>
                <div className="profile-details">
                  <h4>{user?.name || 'Driver Name'}</h4>
                  <p>📧 {user?.email || 'N/A'}</p>
                  <p>📱 {user?.phone || 'N/A'}</p>
                  <p>🆔 ID: {user?.id || 'DRV001'}</p>
                  <p>🎫 License: {driverProfile?.licenseNumber || 'DL123456'}</p>
                  <p>📅 Experience: {driverProfile?.experience || 'Unknown'}</p>
                  <p>📊 Total Trips: {driverProfile?.totalTrips || 0}</p>
                  <p>⭐ Completion Rate: {((driverProfile?.completionRate || 0) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Bus Information */}
            <div className="profile-section">
              <h4>🚌 Bus Information</h4>
              <div className="bus-details-grid">
                <div className="bus-detail-item">
                  <strong>Bus Number:</strong>
                  <span>{busDetails?.busNumber || currentBusNumber}</span>
                </div>
                <div className="bus-detail-item">
                  <strong>Route Name:</strong>
                  <span>{busDetails?.routeName || 'No Route Assigned'}</span>
                </div>
                <div className="bus-detail-item">
                  <strong>Capacity:</strong>
                  <span>{busDetails?.capacity || 50} passengers</span>
                </div>
                <div className="bus-detail-item">
                  <strong>Current Passengers:</strong>
                  <span>{busDetails?.currentPassengers || 0}</span>
                </div>
                <div className="bus-detail-item">
                  <strong>Status:</strong>
                  <span className={`status-badge ${busDetails?.status?.toLowerCase() || 'inactive'}`}>
                    {busDetails?.status || 'Inactive'}
                  </span>
                </div>
                <div className="bus-detail-item">
                  <strong>Trip Status:</strong>
                  <span className={`status-badge ${busDetails?.tripStatus?.toLowerCase() || 'idle'}`}>
                    {busDetails?.tripStatus || 'Idle'}
                  </span>
                </div>
                <div className="bus-detail-item">
                  <strong>Speed:</strong>
                  <span>{busDetails?.speed || 0} km/h</span>
                </div>
                <div className="bus-detail-item">
                  <strong>Engine Status:</strong>
                  <span className={`status-badge ${busDetails?.engineStatus?.toLowerCase() || 'off'}`}>
                    {busDetails?.engineStatus || 'OFF'}
                  </span>
                </div>
                <div className="bus-detail-item">
                  <strong>Current Stop:</strong>
                  <span>{busDetails?.currentStopIndex !== undefined ? `Stop ${busDetails.currentStopIndex + 1}` : 'Not Started'}</span>
                </div>
                <div className="bus-detail-item">
                  <strong>Delay Status:</strong>
                  <span className={`status-badge ${busDetails?.delayStatus ? 'delayed' : 'on-time'}`}>
                    {busDetails?.delayStatus ? 'Delayed' : 'On Time'}
                  </span>
                </div>
                <div className="bus-detail-item">
                  <strong>Delay Minutes:</strong>
                  <span>{busDetails?.delayMinutes || 0} min</span>
                </div>
                <div className="bus-detail-item">
                  <strong>Next Stop:</strong>
                  <span>{busDetails?.nextStopName || 'N/A'}</span>
                </div>
                <div className="bus-detail-item">
                  <strong>Direction:</strong>
                  <span>{busDetails?.direction || 0}°</span>
                </div>
                <div className="bus-detail-item">
                  <strong>Last Updated:</strong>
                  <span>{busDetails?.lastUpdated ? new Date(busDetails.lastUpdated).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Route Summary */}
            {assignedStops.length > 0 && (
              <div className="profile-section">
                <h4>📍 Route Summary</h4>
                <div className="route-summary">
                  <div className="route-info">
                    <span><strong>Current Route:</strong> {busDetails?.routeName || 'Main Route'}</span>
                    <span><strong>Total Stops:</strong> {assignedStops.length}</span>
                    <span><strong>Current Stop:</strong> {currentStopIndex + 1}/{assignedStops.length}</span>
                  </div>
                  <div className="route-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${((currentStopIndex + 1) / assignedStops.length) * 100}%` }}
                      ></div>
                    </div>
                    <span>{Math.round(((currentStopIndex + 1) / assignedStops.length) * 100)}% Complete</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`driver-dashboard ${settings.darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* TOP NAVBAR */}
      <div className="top-navbar">
        <div className="navbar-left">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="burger-menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="navbar-brand">
            <TruckIcon className="w-6 h-6" />
            <span>Driver Control</span>
          </div>
        </div>
        
        <div className="navbar-center">
          <div className="current-page">
            {navigationItems.find(item => item.id === activeTab)?.name || 'Dashboard'}
          </div>
        </div>
        
        <div className="navbar-right">
          <div className={`connection-status ${connected ? 'online' : 'offline'}`}>
            <div className="status-dot"></div>
            <span>{connected ? 'Connected' : 'Offline'}</span>
          </div>
          <div className="trip-status-badge">
            {tripState.replace('_', ' ')}
          </div>
          <button 
            onClick={() => toggleAnalytics(analyticsMode === 'bottom' ? 'none' : 'bottom')}
            className={`analytics-toggle ${analyticsMode !== 'none' ? 'active' : ''}`}
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="driver-info">
            <div className="driver-avatar">
              <UserCircleIcon className="w-8 h-8" />
            </div>
            <div className="driver-details">
              <div className="driver-name">{user?.name || 'Driver'}</div>
              <div className="driver-id">ID: {user?.driverId || 'DRV001'}</div>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <div className="nav-item-content">
                <span className="nav-item-name">{item.name}</span>
                <span className="nav-item-description">{item.description}</span>
              </div>
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="quick-stats">
            <div className="stat-item">
              <BeakerIcon className="w-4 h-4" />
              <span>{speed.toFixed(1)} km/h</span>
            </div>
            <div className="stat-item">
              <MapPinIcon className="w-4 h-4" />
              <span>Stop {currentStopIndex + 1}/{routeStops.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Popup */}
      {showNotificationPopup && (
        <div className="notification-popup">
          <div className="notification-content">
            <div className="notification-header">
              <BellIcon className="w-6 h-6" />
              <span>New Notification</span>
              <button onClick={() => setShowNotificationPopup(false)}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="notification-body">
              {notifications[0]?.message || 'New notification received'}
            </div>
          </div>
        </div>
      )}

      {/* Emergency SOS Button - Always Visible */}
      <button 
        onClick={() => triggerEmergency('accident')}
        className="emergency-sos-btn"
      >
        <ExclamationTriangleIcon className="w-8 h-8" />
        SOS
      </button>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {/* Tab Content */}
        <div className="tab-content">
          {renderTabContent()}
        </div>

        {/* Bottom Analytics Panel */}
        {analyticsMode === 'bottom' && (
          <div className="bottom-analytics-panel">
            <h3>Trip Analytics</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <ClockIcon className="w-6 h-6" />
                <div className="metric-value">{tripMetrics.duration} min</div>
                <div className="metric-label">Duration</div>
              </div>
              <div className="metric-card">
                <BeakerIcon className="w-6 h-6" />
                <div className="metric-value">{tripMetrics.averageSpeed} km/h</div>
                <div className="metric-label">Avg Speed</div>
              </div>
              <div className="metric-card">
                <MapPinIcon className="w-6 h-6" />
                <div className="metric-value">{tripMetrics.stopsCompleted}</div>
                <div className="metric-label">Stops Completed</div>
              </div>
              <div className="metric-card">
                <UserGroupIcon className="w-6 h-6" />
                <div className="metric-value">{tripMetrics.studentCount}</div>
                <div className="metric-label">Students</div>
              </div>
            </div>
          </div>
        )}

        {/* Side Analytics Panel */}
        {analyticsMode === 'side' && (
          <div className="side-analytics-panel">
            <h3>Analytics</h3>
            <div className="side-metrics">
              <div className="side-metric">
                <ClockIcon className="w-5 h-5" />
                <span>{tripMetrics.duration} min</span>
                <small>Duration</small>
              </div>
              <div className="side-metric">
                <BeakerIcon className="w-5 h-5" />
                <span>{tripMetrics.averageSpeed} km/h</span>
                <small>Avg Speed</small>
              </div>
              <div className="side-metric">
                <MapPinIcon className="w-5 h-5" />
                <span>{tripMetrics.stopsCompleted}</span>
                <small>Stops</small>
              </div>
              <div className="side-metric">
                <UserGroupIcon className="w-5 h-5" />
                <span>{tripMetrics.studentCount}</span>
                <small>Students</small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <div className={`status-indicator ${connected ? 'online' : 'offline'}`} />
          <span>{connected ? 'Connected' : 'Offline'}</span>
        </div>
        <div className="status-item">
          <span>Trip: {tripState.replace('_', ' ')}</span>
        </div>
        <div className="status-item">
          <span>Speed: {speed.toFixed(1)} km/h</span>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
