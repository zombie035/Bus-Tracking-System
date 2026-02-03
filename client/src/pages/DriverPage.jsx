// client/src/pages/DriverPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import Navbar from '../components/Layout/Navbar';
import MapComponent from '../components/Common/MapComponent';
import useGeolocation from '../hooks/useGeolocation';
import { busService } from '../services/busService';
import { userService } from '../services/userService';

// New Driver Dashboard Components
import DelayReportModal from '../components/Driver/DelayReportModal';
import EmergencyButton from '../components/Driver/EmergencyButton';
import StudentPickupList from '../components/Driver/StudentPickupList';
import AssignedRouteCard from '../components/Driver/AssignedRouteCard';
import NotificationsPanel from '../components/Driver/NotificationsPanel';
import QuickMessageBar from '../components/Driver/QuickMessageBar';

const DriverDashboard = () => {
  const { user } = useAuth();
  const { socket, connected, sendLocationUpdate } = useSocket();
  const { location, error: locationError, startTracking, stopTracking, isTracking, getCurrentPosition } = useGeolocation();

  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripState, setTripState] = useState('NOT_STARTED'); // NOT_STARTED, IN_PROGRESS, ENDED
  const [tripStartTime, setTripStartTime] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [locationIntervalId, setLocationIntervalId] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [routeStops, setRouteStops] = useState([]);
  const [routePath, setRoutePath] = useState([]); // Array of [lat, lng] for Polyline
  const [toast, setToast] = useState(null);

  // New Driver Dashboard States
  const [showDelayModal, setShowDelayModal] = useState(false);

  // Fetch driver data and bus info
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const busData = await busService.getMyBus();
        console.log('🚌 [DriverPage] getMyBus result:', busData); // DEBUG

        if (busData.success && busData.bus) {
          setBus(busData.bus);
          setStudentCount(busData.bus.students?.length || 0);

          const routeIdentifier = busData.bus.routeId || busData.bus.routeName;
          console.log('📍 [DriverPage] Route Identifier:', routeIdentifier); // DEBUG

          // Fetch route stops if bus has a route
          if (routeIdentifier) {
            console.log('🔄 [DriverPage] Fetching stops for:', routeIdentifier); // DEBUG
            const stopsData = await busService.getRouteStops(routeIdentifier);
            console.log('🛑 [DriverPage] Stops Data:', stopsData); // DEBUG

            if (stopsData.success && stopsData.stops) {
              console.log(`✅ [DriverPage] Setting ${stopsData.stops.length} stops`); // DEBUG
              setRouteStops(stopsData.stops);

              // Set detailed route path if available
              if (stopsData.routePath && stopsData.routePath.length > 0) {
                console.log(`🛣️ [DriverPage] Setting detailed path with ${stopsData.routePath.length} points`);
                setRoutePath(stopsData.routePath);
              } else {
                // Fallback to straight line
                console.log('⚠️ [DriverPage] No detailed path, using straight lines');
                setRoutePath(stopsData.stops.map(s => [s.latitude, s.longitude]));
              }

            } else {
              console.warn('⚠️ [DriverPage] Stops fetching failed or empty:', stopsData);
            }
          } else {
            console.warn('⚠️ [DriverPage] No route ID or Name found on bus object');
          }
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

  // Get initial GPS location when component mounts
  useEffect(() => {
    const getInitialLocation = async () => {
      if (!location && !locationError) {
        try {
          console.log('📍 Fetching initial GPS location...');
          const currentPos = await getCurrentPosition();
          console.log('✅ Initial location obtained:', currentPos);
          setSpeed(currentPos.speed || 0);
          setAccuracy(Math.round(currentPos.accuracy) || 0);
        } catch (error) {
          console.error('❌ Failed to get initial location:', error);
        }
      }
    };

    getInitialLocation();
  }, [location, locationError, getCurrentPosition]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleTrackingCount = (data) => {
      if (data.busId === bus?._id) {
        setStudentCount(data.count);
      }
    };

    socket.on('tracking-count', handleTrackingCount);

    return () => {
      socket.off('tracking-count', handleTrackingCount);
    };
  }, [socket, bus]);

  // Handle location updates
  const handleLocationUpdate = useCallback(async (locationData) => {
    if (!bus?._id) return;

    const speedKmh = locationData.speed ? (locationData.speed * 3.6).toFixed(1) : 0;
    setSpeed(speedKmh);
    setAccuracy(Math.round(locationData.accuracy));

    // Send to server
    try {
      const result = await busService.updateLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        speed: speedKmh,
        accuracy: locationData.accuracy,
        status: 'moving'
      });

      if (result.success) {
        // Also send via socket for real-time updates
        sendLocationUpdate({
          busId: bus._id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          speed: speedKmh,
          status: 'moving',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }, [bus, sendLocationUpdate]);

  // Start Trip
  const startTrip = async () => {
    if (!bus) {
      showToast('No bus assigned to you', 'error');
      return;
    }

    if (locationError) {
      showToast('Please enable location services', 'error');
      return;
    }

    try {
      // Call backend to start trip
      const result = await busService.startTrip();
      if (!result.success) {
        showToast(result.message || 'Failed to start trip', 'error');
        return;
      }

      // Start GPS tracking
      const watchId = startTracking(handleLocationUpdate);
      if (watchId) {
        setIsLive(true);
        setTripState('IN_PROGRESS');
        setTripStartTime(new Date());

        // Set up interval for regular updates every 8 seconds
        const intervalId = setInterval(() => {
          if (location) {
            handleLocationUpdate(location);
          }
        }, 8000);

        setLocationIntervalId(intervalId);
        showToast('Trip started successfully', 'success');
      }
    } catch (error) {
      console.error('Start trip error:', error);
      showToast('Failed to start trip', 'error');
    }
  };

  // ==============================================
  // NEW DRIVER DASHBOARD HANDLERS
  // ==============================================

  // Handle delay report submission
  const handleDelayReport = async (delayData) => {
    try {
      const response = await busService.reportDelay(delayData);
      if (response.success) {
        showToast('✅ Delay reported successfully!', 'success');
        setShowDelayModal(false);
      } else {
        showToast('❌ Failed to report delay', 'error');
      }
    } catch (error) {
      console.error('Error reporting delay:', error);
      showToast('❌ Error reporting delay', 'error');
    }
  };

  // Handle emergency alert
  const handleEmergency = async (alertData) => {
    try {
      const response = await busService.sendEmergencyAlert(alertData);
      if (response.success) {
        showToast('🚨 Emergency alert sent to administration!', 'success');
      } else {
        showToast('❌ Failed to send emergency alert', 'error');
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      showToast('❌ Error sending emergency alert', 'error');
    }
  };

  // End Trip
  const endTrip = async () => {
    try {
      // Call backend to end trip
      const result = await busService.endTrip();
      if (!result.success) {
        showToast(result.message || 'Failed to end trip', 'error');
        return;
      }

      // Stop GPS tracking
      stopTracking();

      // Clear location update interval
      if (locationIntervalId) {
        clearInterval(locationIntervalId);
        setLocationIntervalId(null);
      }

      setIsLive(false);
      setTripState('ENDED');

      // Update bus status to stopped
      if (bus?._id || bus?.id) {
        await busService.updateLocation({
          updateStatusOnly: true,
          status: 'stopped'
        });
      }

      const duration = tripStartTime ? ((new Date() - tripStartTime) / 1000 / 60).toFixed(1) : 0;
      showToast(`Trip ended successfully(Duration: ${duration} min)`, 'success');

      // Reset trip after a delay
      setTimeout(() => {
        setTripState('NOT_STARTED');
        setTripStartTime(null);
      }, 3000);

    } catch (error) {
      console.error('End trip error:', error);
      showToast('Failed to end trip', 'error');
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (locationIntervalId) {
        clearInterval(locationIntervalId);
      }
    };
  }, [locationIntervalId]);

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Map markers - include bus location and route stops
  const mapMarkers = [
    // Current bus location (if available)
    ...(location ? [{
      position: { lat: location.latitude, lng: location.longitude },
      iconHtml: `
        <div style="
          width: 50px;
          height: 50px;
          background: ${tripState === 'IN_PROGRESS' ? '#10b981' : '#2563eb'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          ${tripState === 'IN_PROGRESS' ? 'animation: pulse 2s infinite;' : ''}
        ">
          <i class="fas fa-bus"></i>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 50],
      popup: `
        <div style="padding: 10px; min-width: 200px;">
          <strong>${bus?.busNumber || 'Your Bus'}</strong><br>
          Route: ${bus?.routeName || 'N/A'}<br>
          Speed: ${speed} km/h<br>
          Accuracy: ${accuracy}m<br>
          Status: ${tripState === 'IN_PROGRESS' ? '🟢 On Trip' : '⚪ Idle'}
        </div>
      `
    }] : []),

    // Route stops
    ...routeStops.map((stop, index) => {
      // Determine stop status (demo logic: assuming first half visited if on trip)
      // Real implementation would compare index with currentStopIndex from backend
      const isVisited = tripState === 'IN_PROGRESS' && index < 2; // Demo: first 2 stops visited
      const isNext = tripState === 'IN_PROGRESS' && index === 2; // Demo: 3rd stop is next

      const bgColor = isVisited ? '#94a3b8' : isNext ? '#2563eb' : '#3b82f6';
      const borderColor = isNext ? '#bfdbfe' : 'white';
      const scale = isNext ? 'transform: scale(1.2);' : '';

      return {
        position: { lat: stop.latitude, lng: stop.longitude },
        iconHtml: `
          <div style="
            width: 32px;
            height: 32px;
            background: ${bgColor};
            border-radius: 50%;
            border: 3px solid ${borderColor};
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
            ${scale}
            transition: all 0.3s ease;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popup: `
          <div style="padding: 12px; min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
               <span style="background: ${bgColor}; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px;">${index + 1}</span>
               <strong style="font-size: 14px;">${stop.name || stop.stopName || 'Route Stop'}</strong>
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i> Arrival: <strong>${stop.arrivalTime || 'N/A'}</strong>
            </div>
             <div style="font-size: 12px; color: #64748b;">
              <i class="fas fa-clock" style="margin-right: 4px;"></i> Departure: <strong>${stop.departureTime || 'N/A'}</strong>
            </div>
          </div>
        `
      };
    })
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Add this to your existing DriverPage.jsx return statement:
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white transform transition-transform duration-300 animate-slide-in`}>
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' :
            toast.type === 'error' ? 'fa-exclamation-circle' :
              'fa-info-circle'
            }`}></i>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'D'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
                <div className="hidden md:block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Driver ID: {user?.driverId || 'DRV001'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">{connected ? 'Connected' : 'Disconnected'}</span>
              </div>

              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${tripState === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                tripState === 'ENDED' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                <div className={`w-2 h-2 rounded-full ${tripState === 'IN_PROGRESS' ? 'bg-green-500 animate-pulse' :
                  tripState === 'ENDED' ? 'bg-gray-500' :
                    'bg-blue-500'
                  }`}></div>
                <span className="text-sm font-medium">
                  {tripState === 'IN_PROGRESS' ? '🚌 ON TRIP' :
                    tripState === 'ENDED' ? '✓ COMPLETED' :
                      '⏸️ READY'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Live Location Tracking</h3>
                <div className="flex items-center gap-2">
                  {location && (
                    <span className="text-sm text-gray-600">
                      {parseFloat(location.latitude).toFixed(6)}, {parseFloat(location.longitude).toFixed(6)}
                    </span>
                  )}
                </div>
              </div>

              <div className="h-[400px] relative">
                <MapComponent
                  center={location ? [location.latitude, location.longitude] : [20.5937, 78.9629]}
                  zoom={location ? 15 : 13}
                  markers={mapMarkers}
                  routes={routeStops.length > 1 ? [{
                    coordinates: routeStops.map(s => ({ lat: s.latitude, lng: s.longitude })),
                    color: '#3b82f6',
                    weight: 5,
                    opacity: 0.6
                  }] : []}
                  interactive={true}
                >
                  {/* Route Path */}
                  {routePath.length > 0 && (
                    <Polyline
                      positions={routePath}
                      color="blue"
                      weight={4}
                      opacity={0.6}
                      dashArray={null} // Solid line for actual path
                    />
                  )}
                </MapComponent>

                {locationError && (
                  <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 z-10">
                    <div className="flex items-center gap-3">
                      <i className="fas fa-exclamation-triangle text-red-500"></i>
                      <div>
                        <p className="text-red-700 font-medium">Location Error</p>
                        <p className="text-red-600 text-sm">{locationError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tripState === 'NOT_STARTED' || tripState === 'ENDED' ? (
                <button
                  onClick={startTrip}
                  disabled={!bus || locationError}
                  className="p-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed md:col-span-2"
                >
                  <i className="fas fa-play-circle text-xl"></i>
                  Start Trip
                </button>
              ) : (
                <button
                  onClick={endTrip}
                  className="p-4 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all flex items-center justify-center gap-3 md:col-span-2"
                >
                  <i className="fas fa-stop-circle text-xl"></i>
                  End Trip
                </button>
              )}

              <button
                onClick={() => location && window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank')}
                disabled={!location}
                className="p-4 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 md:col-span-2"
              >
                <i className="fas fa-external-link-alt text-xl"></i>
                Open in Google Maps
              </button>
            </div>
          </div>

          {/* Right Sidebar - Enhanced Driver Dashboard */}
          <div className="space-y-6">
            {/* Emergency Button - Top Priority */}
            <EmergencyButton onEmergency={handleEmergency} />

            {/* Bus Info Card */}
            {bus && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <i className="fas fa-bus text-xl"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{bus.busNumber}</h3>
                      <p className="text-sm text-gray-600">{bus.routeName || 'No route assigned'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <i className="fas fa-users text-blue-600 mb-2"></i>
                    <div className="text-xs text-gray-600">Passengers</div>
                    <div className="text-xl font-bold text-gray-900">{bus.currentPassengers || 0}/{bus.capacity}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <i className="fas fa-tachometer-alt text-green-600 mb-2"></i>
                    <div className="text-xs text-gray-600">Status</div>
                    <div className="text-sm font-bold text-gray-900 capitalize">{bus.status || 'idle'}</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowDelayModal(true)}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-clock"></i>
                  <span>Report Delay</span>
                </button>
              </div>
            )}

            {/* Assigned Route Card */}
            <AssignedRouteCard />

            {/* Quick Messages */}
            <QuickMessageBar />

            {/* Notifications Panel */}
            <NotificationsPanel />

            {/* Student Pickup List */}
            <StudentPickupList />
          </div>
        </div>

        {/* Delay Report Modal */}
        <DelayReportModal

          isOpen={showDelayModal}
          onClose={() => setShowDelayModal(false)}
          onSubmit={handleDelayReport}
        />

        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 z-50 ${toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
              }`}
          >
            <div className="flex items-center gap-3">
              <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' :
                toast.type === 'error' ? 'fa-exclamation-circle' :
                  'fa-info-circle'} text-xl`}></i>
              <div>
                <p className="font-semibold">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
