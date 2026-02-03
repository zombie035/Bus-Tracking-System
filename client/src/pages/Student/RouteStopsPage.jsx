import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';
import { busService } from '../../services/busService';
import RouteStopsPanel from '../../components/Student/RouteStopsPanel';
import MapComponent from '../../components/Common/MapComponent';

const RouteStopsPage = () => {
    const [stops, setStops] = useState([]);
    const [bus, setBus] = useState(null);
    const [profile, setProfile] = useState(null);
    const [routePath, setRoutePath] = useState([]);

    // Map State
    const [center, setCenter] = useState([9.925201, 78.119775]); // Default
    const [zoom, setZoom] = useState(13);
    const [selectedStop, setSelectedStop] = useState(null);

    const { socket, joinBusRoom } = useSocket();

    useEffect(() => {
        const fetchRouteData = async () => {
            try {
                // Fetch Bus
                const busData = await busService.getStudentBus();
                if (busData) {
                    setBus(busData);
                    if (busData.latitude && busData.longitude) {
                        setCenter([busData.latitude, busData.longitude]);
                    }
                    if (busData._id) joinBusRoom(busData._id);
                }

                // Fetch Stops & Path
                const [stopsRes, routeRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/student/route-stops'), // Use full url or verify proxy
                    axios.get('http://localhost:5000/api/student/route')
                ]);

                // Using axios directly for now to match Home.jsx pattern, or should use service?
                // Using endpoints from Home.jsx for consistency

                if (stopsRes.data.success) {
                    setStops(stopsRes.data.stops || []);
                }

                if (routeRes.data && routeRes.data.path) {
                    setRoutePath(routeRes.data.path);
                }

                // Fetch Profile
                const profileRes = await axios.get('http://localhost:5000/api/student/profile');
                if (profileRes.data) {
                    setProfile(profileRes.data);
                }

            } catch (error) {
                console.error('Error loading route data:', error);
            }
        };

        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchRouteData();
        }
    }, [joinBusRoom]);

    // Live Bus Update
    useEffect(() => {
        if (!socket) return;
        const handleBusUpdate = (data) => {
            setBus(prev => ({ ...prev, latitude: data.latitude, longitude: data.longitude }));
        };
        socket.on('busLocationUpdate', handleBusUpdate); // Correct event name from Home.jsx
        return () => {
            socket.off('busLocationUpdate', handleBusUpdate);
        };
    }, [socket]);

    const handleStopClick = (stop) => {
        if (stop.latitude && stop.longitude) {
            setCenter([parseFloat(stop.latitude), parseFloat(stop.longitude)]);
            setZoom(16);
            setSelectedStop(stop);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row">
            {/* Left Panel: List */}
            <div className="h-1/2 md:h-full md:w-1/3 lg:w-96 overflow-y-auto bg-gray-50 border-r border-gray-200">
                <div className="p-4 md:p-6">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6">Route Details</h1>
                    <RouteStopsPanel
                        stops={stops}
                        currentBusLocation={bus}
                        boardingStop={profile?.boardingStop}
                        droppingStop={profile?.droppingStop}
                        onStopClick={handleStopClick}
                    />
                </div>
            </div>

            {/* Right Panel: Map */}
            <div className="h-1/2 md:h-full md:flex-1 relative">
                <MapComponent
                    center={center}
                    zoom={zoom}
                    markers={[
                        // Bus Marker
                        ...(bus && bus.latitude ? [{
                            position: { lat: bus.latitude, lng: bus.longitude },
                            popup: `Bus ${bus.busNumber || ''}`,
                            type: 'bus',
                            iconHtml: '<div style="background:#4285F4; border: 2px solid white; width: 40px; height: 40px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><i class="fas fa-bus text-white"></i></div>',
                            size: 40
                        }] : []),
                        // Stop Markers
                        ...stops.map((stop, index) => ({
                            position: { lat: parseFloat(stop.latitude), lng: parseFloat(stop.longitude) },
                            iconHtml: `<div style="width: 12px; height: 12px; background: ${selectedStop?.name === stop.name ? '#EA4335' : 'white'}; border: 3px solid #EA4335; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3); transform: ${selectedStop?.name === stop.name ? 'scale(1.5)' : 'scale(1)'}; transition: transform 0.2s;"></div>`,
                            iconSize: [20, 20],
                            popup: `Stop ${index + 1}: ${stop.stopName || stop.name} \n ${stop.pickupTime ? `Pickup: ${stop.pickupTime}` : ''}`
                        }))
                    ]}
                    routes={routePath.length > 0 ? [{
                        coordinates: routePath.map(p => ({ lat: parseFloat(p[0]), lng: parseFloat(p[1]) })),
                        color: '#4285F4',
                        weight: 4,
                        opacity: 0.8
                    }] : []}
                    className="w-full h-full"
                />
            </div>
        </div>
    );
};

export default RouteStopsPage;
