// client/src/pages/Student/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup } from 'react-leaflet';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
    MapIcon,
    BellIcon,
    Cog6ToothIcon,
    ArrowPathIcon,
    GlobeAltIcon,
    SunIcon,
    MoonIcon,
    TruckIcon,
    ViewfinderCircleIcon
} from '@heroicons/react/24/outline';

// Services & Hooks
import { busService } from '../../services/busService';
import useGeolocation from '../../hooks/useGeolocation';
import { useSocket } from '../../contexts/SocketContext';
import TopContextBar from '../../components/Student/TopContextBar';
import UniversalBottomSheet from '../../components/Student/UniversalBottomSheet';

// --- Custom Hooks for Map ---
function MapController({ center, zoom, autoAlign, compassHeading }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, zoom, map]);

    useEffect(() => {
        if (autoAlign && compassHeading !== null) {
            // map.setBearing(compassHeading); // Standard Leaflet does not support bearing/rotation without plugins
            // We only rotate the compass needle in the UI for now
        } else {
            // Optional: reset to 0 when autoAlign is off, or leave as is
            // if (!autoAlign) map.setBearing(0);
        }
    }, [autoAlign, compassHeading, map]);

    return null;
}

// --- Compass Hook for Device Orientation ---
function useCompass() {
    const [heading, setHeading] = useState(0);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('DeviceOrientationEvent' in window) {
            setIsSupported(true);
            const handleOrientation = (event) => {
                if (event.alpha !== null) {
                    // Alpha is 0-360, representing the direction the device is facing
                    // We invert it for the map bearing if needed, or just pass it through
                    // Usually: bearing = 360 - alpha
                    const compassHeading = Math.round(360 - event.alpha);
                    setHeading(compassHeading);
                }
            };
            window.addEventListener('deviceorientation', handleOrientation);
            return () => window.removeEventListener('deviceorientation', handleOrientation);
        } else {
            setIsSupported(false);
        }
    }, []);

    return { heading, isSupported };
}

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { socket, joinBusRoom } = useSocket();
    const { location: studentLocation, startTracking } = useGeolocation();

    // Compass
    const { heading: deviceHeading, isSupported: compassSupported } = useCompass();

    // State
    const [activeSheet, setActiveSheet] = useState(null); // 'route', 'notifications', 'settings', or null
    const [mapCenter, setMapCenter] = useState([9.9252, 78.1198]);
    const [mapZoom, setMapZoom] = useState(15);
    const [autoAlign, setAutoAlign] = useState(false);
    const [compassHeading, setCompassHeading] = useState(0);
    const [loading, setLoading] = useState(true);
    const [mapTheme, setMapTheme] = useState('default'); // Default to standard OSM

    // Sync compass
    useEffect(() => {
        if (autoAlign && compassSupported) {
            setCompassHeading(deviceHeading);
        } else if (!autoAlign) {
            setCompassHeading(0);
        }
    }, [deviceHeading, autoAlign, compassSupported]);


    // Data State
    const [busLocation, setBusLocation] = useState(null);
    const [currentStop, setCurrentStop] = useState({ name: "Loading...", eta: "--", distance: "--", busId: "--" });
    const [stops, setStops] = useState([]);
    const [nearestStopId, setNearestStopId] = useState(null); // Track nearest stop for highlighting
    const [nearestStopOrder, setNearestStopOrder] = useState(0); // Track progress
    const [profile, setProfile] = useState(null);
    const [eta, setEta] = useState(null);
    const [fullRoutePath, setFullRoutePath] = useState([]); // Store detailed path from backend
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // --- Initial Data Fetching ---
    // --- Initial Data Fetching ---
    const refreshData = async () => {
        try {
            setLoading(true);
            // 1. Fetch Profile
            const profileRes = await busService.getMyProfile();
            console.log("DEBUG: Profile Payload:", profileRes);
            console.log("DEBUG: Driver Data:", {
                name: profileRes.profile?.driverName,
                phone: profileRes.profile?.driverPhone,
                debug: profileRes.debug
            });
            if (profileRes.success) setProfile(profileRes.profile);

            // 2. Fetch Route Stops
            const routeRes = await busService.getMyRouteStops();
            console.log("DEBUG: Route Stops Response:", routeRes);
            if (routeRes.success) {
                setStops(routeRes.stops || []);
                if (routeRes.routePath && routeRes.routePath.length > 0) {
                    setFullRoutePath(routeRes.routePath);
                }
            }

            // 3. Fetch Initial Bus Location
            const busRes = await busService.getStudentBus();
            if (busRes) {
                setBusLocation([busRes.latitude, busRes.longitude]);
                // Only center map on first load or manual center, not every refresh to avoid annoyance
                // setMapCenter([busRes.latitude, busRes.longitude]); 
                if (busRes.busId) joinBusRoom(busRes.busId._id || busRes.busId);

                // Initial Calculation with fetched stops
                if (busRes.latitude && busRes.longitude && routeRes.success && routeRes.stops) {
                    updateJourneyStatus(busRes.latitude, busRes.longitude, busRes.speed || 30, routeRes.stops);
                }
            }

            // Start tracking student location
            startTracking();

            // 4. Fetch Notifications
            try {
                const notifRes = await busService.getStudentNotifications();
                if (notifRes.success) {
                    setNotifications(notifRes.notifications);
                    setUnreadCount(notifRes.unreadCount);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }

        } catch (err) {
            console.error("Dashboard fetch error:", err);
            toast.error("Failed to refresh data");
        } finally {
            setLoading(false);
            if (!loading) toast.success("Successfully refreshed!");
        }
    };

    useEffect(() => {
        refreshData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // --- Socket Updates ---
    // --- Socket Updates ---
    useEffect(() => {
        if (!socket) return;

        socket.on('busLocationUpdate', (data) => {
            console.log("Live Bus Update:", data);
            if (data.latitude && data.longitude) {
                setBusLocation([data.latitude, data.longitude]);
                // Update ETA and Highlight logic
                updateJourneyStatus(data.latitude, data.longitude, data.speed);
            }
        });

        // Listen for new notifications
        socket.on('receive-notification', (notif) => {
            console.log("🔔 New Notification Received:", notif);
            setNotifications(prev => [notif, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.info(
                <div onClick={() => setActivePopup('notifications')} className="cursor-pointer">
                    <strong>{notif.title}</strong>
                    <div className="text-sm">{notif.message}</div>
                </div>,
                { autoClose: 5000 }
            );
        });

        return () => {
            socket.off('busLocationUpdate');
            socket.off('receive-notification');
        };
    }, [socket, stops]); // Depend on stops to calculate nearest


    // --- Sheet Handlers ---
    const handleSheetChange = (sheetType) => {
        setActiveSheet(sheetType);
        // Clear unread count when opening notifications
        if (sheetType === 'notifications') {
            setUnreadCount(0);
        }
    };

    const handleSheetClose = () => {
        setActiveSheet(null);
    };



    // --- Black & White Icons ---
    const busIcon = new Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="white" stroke="black" stroke-width="1.5">
        <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 8h14V6c0-1.5-1.5-2.5-7-2.5S5 4.5 5 6v2z"/>
      </svg>
    `),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });

    const stopIcon = new Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="6" fill="white" stroke="black" stroke-width="2"/>
        <circle cx="12" cy="12" r="2" fill="black"/>
      </svg>
    `),
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });

    const studentIcon = new Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="black" stroke="white" stroke-width="1.5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
    `),
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });

    const activeStopIcon = new Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="rgba(255, 200, 0, 0.5)" stroke="orange" stroke-width="2">
            <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="12" r="4" fill="darkorange" stroke="white" stroke-width="1"/>
      </svg>
    `),
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

    const passedStopIcon = new Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" fill="#10B981" stroke="#059669" stroke-width="2"/>
        <path d="M8 12l3 3 5-5" stroke="white" stroke-width="2" fill="none"/>
      </svg>
    `),
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });

    // Haversine Distance Helper
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    // Update Journey Logic
    const updateJourneyStatus = (busLat, busLon, speed = 30, stopsOverride = null) => {
        const stopsToUse = stopsOverride || stops;
        if (!stopsToUse || stopsToUse.length === 0) {
            console.log("DEBUG: No stops available to calc ETA");
            return;
        }

        console.log(`DEBUG: Updating Journey. Bus: [${busLat}, ${busLon}], Speed: ${speed}`);

        let minDistance = Infinity;
        let nearest = null;

        stopsToUse.forEach(stop => {
            if (stop.latitude && stop.longitude) {
                const dist = calculateDistance(busLat, busLon, stop.latitude, stop.longitude);
                // console.log(`Stop: ${stop.stopName}, Dist: ${dist.toFixed(2)}km`);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = stop;
                }
            }
        });

        if (nearest) {
            console.log(`DEBUG: Nearest Stop: ${nearest.stopName}, Distance: ${minDistance.toFixed(2)}km`);
            setNearestStopId(nearest._id || nearest.id);
            setNearestStopOrder(nearest.stopOrder || 0);

            // Calculate ETA (Time = Distance / Speed)
            // Speed defaults to 30 km/h if not provided or 0
            const validSpeed = speed > 0 ? speed : 30;
            const timeHours = minDistance / validSpeed;
            const timeMinutes = Math.ceil(timeHours * 60);

            console.log(`DEBUG: ETA Calc: ${timeMinutes} min (${minDistance.toFixed(2)}km @ ${validSpeed}km/h)`);

            let etaString = `${timeMinutes} min`;
            if (timeMinutes < 1) etaString = "Arriving Now";

            setCurrentStop(prev => ({
                ...prev,
                name: nearest.stopName,
                eta: etaString,
                distance: `${minDistance.toFixed(1)} km`
                // Preserve busId from previous state or busRes logic if needed
            }));
        }
    };



    // Calculate Route Path: Use Detailed Backend Path if available, else Fallback to Straight Lines
    const routePath = fullRoutePath.length > 0
        ? fullRoutePath
        : stops
            .filter(stop => stop.latitude && stop.longitude)
            .map(stop => [stop.latitude, stop.longitude]);

    // Helper: Format Time
    const formatTime = (timeStr) => {
        if (!timeStr || timeStr === '--:--') return '--:--';
        // Handle "HH:mm:ss" or "HH:mm"
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    // Helper to get Tile Layer Props
    const getTileLayerProps = () => {
        switch (mapTheme) {
            case 'satellite':
                return {
                    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    subdomains: []
                };
            case 'dark':
                return {
                    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                    subdomains: "abcd"
                };
            case 'light':
                return {
                    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
                    subdomains: "abcd"
                };
            case 'default':
            default:
                return {
                    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    subdomains: "abc"
                };
        }
    };

    const tileProps = getTileLayerProps();



    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans">


            {/* 1. TOP CONTEXT BAR */}
            <TopContextBar
                title="Bus Tracker"
                onProfileClick={() => handleSheetChange('profile')}
            />

            {/* 2. MAIN MAP CONTAINER */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    zoomControl={false}
                    attributionControl={false}
                    className="w-full h-full bg-[#111]"
                    style={{ background: '#111' }}
                >
                    <MapController center={mapCenter} zoom={mapZoom} autoAlign={autoAlign} compassHeading={compassHeading} />

                    {/* Dynamic Theme Tile Layer */}
                    <TileLayer
                        url={tileProps.url}
                        subdomains={tileProps.subdomains}
                        maxZoom={20}
                    />

                    {/* Route Path Polyline */}
                    {routePath.length > 0 && (
                        <Polyline
                            positions={routePath}
                            pathOptions={{
                                color: mapTheme === 'dark' ? 'white' : 'blue',
                                weight: 5,
                                opacity: 0.7,
                                dashArray: '1, 0'
                            }}
                        />
                    )}

                    {/* Markers */}
                    {busLocation && <Marker position={busLocation} icon={busIcon} />}
                    {studentLocation && <Marker position={[studentLocation.latitude, studentLocation.longitude]} icon={studentIcon} />}

                    {stops.map(stop => (
                        stop.latitude && stop.longitude && (
                            <Marker
                                key={stop._id || stop.id}
                                position={[stop.latitude, stop.longitude]}
                                icon={
                                    (nearestStopId === (stop._id || stop.id)) ? activeStopIcon :
                                        (stop.stopOrder < nearestStopOrder) ? passedStopIcon :
                                            stopIcon
                                }
                                zIndexOffset={(nearestStopId === (stop._id || stop.id)) ? 1000 : 0}
                            >
                                <Popup>
                                    <div className="text-center min-w-[120px]">
                                        <h3 className="font-bold text-sm text-black mb-1">
                                            {stop.stopName}
                                            {(nearestStopId === (stop._id || stop.id)) && <span className="ml-1 text-xs text-orange-600 font-extrabold">(NEXT)</span>}
                                            {(stop.stopOrder < nearestStopOrder) && <span className="ml-1 text-xs text-green-600 font-bold">(PASSED)</span>}
                                        </h3>
                                        <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                                            <span className="font-medium">Stop #{stop.stopOrder}</span>
                                            <span>•</span>
                                            <span className="font-medium text-blue-600">{formatTime(stop.pickupTime)}</span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    ))}

                </MapContainer>


                {/* Compass / Auto Align Toggle */}
                <button
                    onClick={() => {
                        // Toggle auto-align
                        setAutoAlign(!autoAlign);
                        if (!autoAlign) {
                            // If turning ON, snap to current heading immediately if possible
                            setCompassHeading(deviceHeading);
                        } else {
                            // If turning OFF, reset bearing to 0
                            setCompassHeading(0);
                        }
                    }}
                    className={`absolute top-28 right-4 z-[900] p-3 rounded-full transition-all duration-300 shadow-xl border-2 ${autoAlign ? 'bg-white text-blue-600 border-white active' : 'bg-black/70 text-white border-white/30 backdrop-blur-md hover:bg-black/80'
                        }`}
                >
                    <div className="relative w-6 h-6 flex items-center justify-center">
                        {/* Compass Ring */}
                        <svg
                            className="w-full h-full absolute inset-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="10" className="opacity-50" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                        </svg>

                        {/* Compass Needle - Rotates */}
                        <svg
                            className={`w-4 h-4 transition-transform duration-500 origin-center`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            style={{ transform: `rotate(${autoAlign ? -compassHeading : 0}deg)` }}
                        >
                            <path d="M12 2L15 22L12 18L9 22L12 2Z" />
                        </svg>
                    </div>
                </button>

                {/* Center Bus Button */}
                <button
                    onClick={() => {
                        if (busLocation) {
                            // Spread to force new reference ref for useEffect to trigger
                            setMapCenter([...busLocation]);
                            setMapZoom(16);
                        }
                    }}
                    className="absolute top-44 right-4 z-[900] p-3 rounded-full transition-all duration-300 shadow-xl bg-white text-black hover:bg-gray-100"
                    title="Center on Bus"
                >
                    <ViewfinderCircleIcon className="w-6 h-6" />
                </button>
            </div>




            {/* 3. UNIVERSAL BOTTOM SHEET */}
            <UniversalBottomSheet
                sheetType={activeSheet}
                onClose={handleSheetClose}
                onSheetChange={handleSheetChange}
                // Route props
                stops={stops}
                profile={profile}
                nextStop={{ name: currentStop.name }}
                eta={{ minutes: currentStop.eta || '--' }}
                distance={currentStop.distance}
                nearestStopOrder={nearestStopOrder}
                // Notifications props
                notifications={notifications}
                // Settings props
                mapTheme={mapTheme}
                onMapThemeChange={setMapTheme}
                onLogout={logout}
            />


            {/* 4. STATIC BOTTOM NAVBAR - PRIMARY NAVIGATION */}
            <div className="fixed bottom-0 left-0 right-0 z-[1200] safe-bottom">
                <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200 px-4 py-2 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">

                    {/* Map */}
                    <button
                        onClick={() => handleSheetChange(null)}
                        className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 ${activeSheet === null
                            ? 'bg-black text-white scale-105'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <MapIcon className="w-6 h-6 mb-1" strokeWidth={activeSheet === null ? 2.5 : 2} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Map</span>
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={() => {
                            refreshData();
                            if (busLocation) {
                                setMapCenter(busLocation);
                                setMapZoom(16);
                            }
                        }}
                        className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 ${loading ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <ArrowPathIcon className={`w-6 h-6 mb-1 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Refresh</span>
                    </button>

                    {/* Route */}
                    <button
                        onClick={() => handleSheetChange('route')}
                        className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 ${activeSheet === 'route'
                            ? 'bg-black text-white scale-105'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <TruckIcon className="w-6 h-6 mb-1" strokeWidth={activeSheet === 'route' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Route</span>
                    </button>

                    {/* Notifications */}
                    <button
                        onClick={() => handleSheetChange('notifications')}
                        className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 relative ${activeSheet === 'notifications'
                            ? 'bg-black text-white scale-105'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <BellIcon className="w-6 h-6 mb-1" strokeWidth={activeSheet === 'notifications' ? 2.5 : 2} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wide">Alerts</span>
                    </button>

                    {/* Settings */}
                    <button
                        onClick={() => handleSheetChange('settings')}
                        className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 ${activeSheet === 'settings'
                            ? 'bg-black text-white scale-105'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <Cog6ToothIcon className="w-6 h-6 mb-1" strokeWidth={activeSheet === 'settings' ? 2.5 : 2} />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Settings</span>
                    </button>

                </div>
            </div>

            {/* Toast Container */}
            <ToastContainer position="top-center" autoClose={2000} hideProgressBar={true} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
        </div>
    );
};

export default StudentDashboard;
