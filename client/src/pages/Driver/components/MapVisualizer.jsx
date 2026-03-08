import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Icons (Using CDN for reliability or local assets if available)
// For now, simpler SVG placeholders or standard Leaflet icons customized via CSS
const busIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', // Placeholder Bus Icon
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    className: 'bus-marker-icon'
});

const stopIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png', // Placeholder Stop
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    className: 'stop-marker-upcoming'
});

const activeStopIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    className: 'stop-marker-active'
});

const completedStopIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    className: 'stop-marker-completed'
});

// Map Controller Component
const MapController = ({ center, zoom, speed, autoZoom, routeLock }) => {
    const map = useMap();

    useEffect(() => {
        if (center && routeLock) {
            map.flyTo(center, zoom, { animate: true, duration: 1.5 });
        }
    }, [center, zoom, routeLock, map]);

    useEffect(() => {
        if (autoZoom && speed !== null && routeLock) {
            // Auto zoom based on speed: Higher speed = zoom out
            const newZoom = speed > 60 ? 14 : speed > 30 ? 15 : 17;
            if (map.getZoom() !== newZoom) {
                map.setZoom(newZoom);
            }
        }
    }, [speed, autoZoom, routeLock, map]);

    return null;
};

const MapVisualizer = ({
    busLocation,
    routePath,
    stops,
    currentStopIndex,
    speed,
    settings
}) => {
    const { autoZoom, routeLock, trafficOverlay, layoutConfig } = settings;
    const theme = layoutConfig?.theme || 'auto';
    const showZoom = layoutConfig?.showZoom !== false; // Default to true if not specified

    // Determine Theme
    const isDark = theme === 'dark' || (theme === 'auto' && new Date().getHours() >= 18);
    const isHighContrast = theme === 'high-contrast';

    // Determine Map Center
    const center = busLocation || [9.9252, 78.1198];

    return (
        <div className={`map-visualizer-container ${isHighContrast ? 'high-contrast-map' : ''}`}>
            <MapContainer
                center={center}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                zoomControl={showZoom}
                attributionControl={false}
            >
                {/* Theme-based Tile Layer */}
                <TileLayer
                    url={isDark || isHighContrast
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Traffic Layer */}
                {trafficOverlay && (
                    <TileLayer
                        url="https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}"
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                        opacity={0.6}
                    />
                )}

                <MapController
                    center={center}
                    zoom={16}
                    speed={speed}
                    autoZoom={autoZoom}
                    routeLock={routeLock}
                />

                {/* Route Polyline */}
                {routePath && routePath.length > 0 && (
                    <Polyline
                        positions={routePath}
                        color="#3b82f6"
                        weight={6}
                        opacity={0.8}
                        lineCap="round"
                    />
                )}

                {/* Bus Marker */}
                {busLocation && (
                    <Marker position={busLocation} icon={busIcon} zIndexOffset={1000}>
                        <Popup>
                            <div className="bus-popup">
                                <strong>Current Speed</strong>
                                <p>{speed.toFixed(1)} km/h</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Stop Markers */}
                {stops && stops.map((stop, index) => {
                    let icon = stopIcon;
                    if (index < currentStopIndex) icon = completedStopIcon;
                    if (index === currentStopIndex) icon = activeStopIcon;

                    return (
                        <Marker
                            key={stop.id || index}
                            position={[stop.lat, stop.lng]}
                            icon={icon}
                        >
                            <Popup>{stop.name}</Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Speed Overlay */}
            <div className="speed-overlay">
                <span className="speed-value">{Math.round(speed)}</span>
                <span className="speed-unit">KM/H</span>
            </div>
        </div>
    );
};

export default MapVisualizer;
