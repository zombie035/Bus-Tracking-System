import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import useGeolocation from '../../hooks/useGeolocation';

import { busService } from '../../services/busService';
import MapComponent from '../../components/Common/MapComponent';
import TopQuickNav from '../../components/Student/TopQuickNav';
import FloatingMapControls from '../../components/Student/FloatingMapControls';
import SwipeableBottomSheet from '../../components/Student/SwipeableBottomSheet';
import EmergencyAlertBanner from '../../components/Student/EmergencyAlertBanner';

const StudentHome = () => {
    const { user } = useAuth();
    const { socket, joinBusRoom } = useSocket();
    const { location } = useGeolocation();

    // State
    const [bus, setBus] = useState({});
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);
    const [routeStops, setRouteStops] = useState([]);
    const [busRoutePath, setBusRoutePath] = useState([]);
    const [profile, setProfile] = useState(null);
    const [busStatus, setBusStatus] = useState(null);
    const [emergencyAlert, setEmergencyAlert] = useState(null);
    const [nextStop, setNextStop] = useState(null);

    // UI State
    const [mapType, setMapType] = useState('normal');
    const [showRoute, setShowRoute] = useState(true);
    const [showUserPath, setShowUserPath] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Fetch initial bus data
                const busData = await busService.getStudentBus();
                if (busData) {
                    setBus(busData);
                    if (busData._id && joinBusRoom) joinBusRoom(busData._id);
                }

                console.log("🚀 Student Dashboard: Fetching data...");
                const [profileData, routeData] = await Promise.all([
                    busService.getMyProfile(),
                    busService.getMyRouteStops()
                ]);

                console.log("👤 Profile Response:", profileData);
                console.log("🛣️ Route Response:", routeData);

                if (profileData && profileData.success) {
                    setProfile(profileData.profile);
                } else if (profileData?.profile) {
                    // Handle case where it might return data directly or in different format
                    setProfile(profileData.profile);
                }

                if (routeData && routeData.success) {
                    console.log("✅ Setting route stops:", routeData.stops);

                    // Normalize data structure for frontend components
                    const normalizedStops = (routeData.stops || []).map(stop => ({
                        ...stop,
                        name: stop.stopName || stop.name, // Handle backend alias
                        scheduledTime: stop.pickupTime || stop.time || '--:--', // Prefer pickupTime
                        latitude: parseFloat(stop.latitude),
                        longitude: parseFloat(stop.longitude)
                    }));

                    setRouteStops(normalizedStops);

                    if (routeData.routePath && Array.isArray(routeData.routePath)) {
                        setBusRoutePath(routeData.routePath);
                    }

                    // Set next stop from bus status or default to first if waiting
                    if (normalizedStops.length > 0) {
                        // Ideally this comes from busStatus.nextStopName, but for now fallback ensures data visibility
                        setNextStop(prev => prev || normalizedStops[0]);
                    }
                } else {
                    console.error("❌ Route data missing or unsuccessful:", routeData);
                }
            } catch (error) {
                console.error("❌ Error fetching dashboard data:", error);
            }

        };

        fetchDashboardData();
    }, [joinBusRoom]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('busLocationUpdate', (data) => {
            setBus(prev => ({ ...prev, ...data }));
            calculateETA(data.latitude, data.longitude);
        });

        socket.on('tripStatusUpdate', (data) => {
            setBusStatus(data);
        });

        socket.on('emergencyAlert', (alert) => {
            setEmergencyAlert(alert);
        });

        return () => {
            socket.off('busLocationUpdate');
            socket.off('tripStatusUpdate');
            socket.off('emergencyAlert');
        };
    }, [socket]);

    const calculateETA = async (busLat, busLng) => {
        // Mock ETA Logic 
        setEta({ minutes: Math.floor(Math.random() * 20) + 5 });
        setDistance('4.2 km');

        if (routeStops.length > 0) {
            setNextStop(routeStops[0]);
        }
    };

    const handleRecenter = () => {
        // Trigger recenter logic (omitted for brevity, requires Map ref)
        console.log("Recenter requested");
    };

    const handleShowFullPath = () => {
        setShowRoute(true);
        setShowUserPath(false);
    };

    const handleShowUserPath = () => {
        setShowRoute(false);
        setShowUserPath(true);
    };


    return (
        <div className="relative w-full h-[calc(100vh-64px)] md:h-screen overflow-hidden bg-white">
            {/* 1. Top Quick Nav (Replaces Search Bar) */}
            <TopQuickNav
                user={user}
                onMenuClick={() => { }} // Might be redundant if menu is swipe-up only now
            />

            {/* 2. Floating Controls */}
            <FloatingMapControls
                mapType={mapType}
                onMapTypeChange={setMapType}
                showRoute={showRoute}
                onToggleRoute={() => setShowRoute(!showRoute)}
                onRecenter={handleRecenter}
            />

            {/* 3. Fullscreen Map */}
            <div className="absolute inset-0 z-0">
                <MapComponent
                    center={[bus.latitude || 9.925201, bus.longitude || 78.119775]}
                    zoom={15}
                    tileLayer={mapType === 'satellite' ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                    markers={[
                        {
                            position: { lat: bus.latitude || 9.925201, lng: bus.longitude || 78.119775 },
                            popup: `Bus ${bus.busNumber}`,
                            type: 'bus',
                            iconHtml: '<div style="background:#4285F4; border: 2px solid white; width: 48px; height: 48px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><i class="fas fa-bus text-white text-xl"></i></div>',
                            size: 48,
                            iconSize: [48, 48],
                            iconAnchor: [24, 24]
                        },
                        ...(location ? [{
                            position: { lat: location.latitude, lng: location.longitude },
                            popup: 'My Location',
                            type: 'student',
                            iconHtml: '<div style="background: rgba(66, 133, 244, 0.3); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><div style="background: #4285F4; width: 18px; height: 18px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div></div>',
                            size: 60,
                            iconSize: [60, 60],
                            iconAnchor: [30, 30]
                        }] : []),
                        ...routeStops.map((stop, index) => ({
                            position: { lat: parseFloat(stop.latitude), lng: parseFloat(stop.longitude) },
                            iconHtml: `<div style="width: 16px; height: 16px; background: white; border: 4px solid #EA4335; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
                            iconSize: [16, 16],
                            iconAnchor: [8, 8],
                            popup: stop.name
                        }))
                    ]}
                    routes={[
                        // Full Route Path
                        ...(showRoute && busRoutePath.length > 0 ? [{
                            coordinates: busRoutePath.map(p => ({ lat: parseFloat(p[0]), lng: parseFloat(p[1]) })),
                            color: '#4285F4',
                            weight: 6,
                            opacity: 1
                        }] : []),
                        // User-to-Bus Path (Direct Line for now, ideally API routed)
                        ...(showUserPath && location && bus.latitude ? [{
                            coordinates: [{ lat: bus.latitude, lng: bus.longitude }, { lat: location.latitude, lng: location.longitude }],
                            color: '#52525b',
                            weight: 4,
                            opacity: 0.8,
                            dashed: true
                        }] : [])
                    ]}
                    className="w-full h-full"
                />
            </div>

            {/* 4. Swipeable Bottom Sheet */}
            <SwipeableBottomSheet
                busStatus={busStatus}
                eta={eta}
                distance={distance}
                nextStop={nextStop}
                stops={routeStops}
                profile={profile}
                onShowFullPath={handleShowFullPath}
                onShowUserPath={handleShowUserPath}
            />

            {emergencyAlert && (
                <div className="absolute top-24 left-4 right-16 z-[950]">
                    <EmergencyAlertBanner alert={emergencyAlert} onDismiss={() => setEmergencyAlert(null)} />
                </div>
            )}
        </div>
    );
};

export default StudentHome;
