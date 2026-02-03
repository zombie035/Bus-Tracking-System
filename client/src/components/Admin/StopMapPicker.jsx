// client/src/components/Admin/StopMapPicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Use a blue marker for bus stops
const stopIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map clicks
function LocationMarker({ position, onLocationSelect, stopName }) {
    const [marker, setMarker] = useState(position);

    const map = useMapEvents({
        click(e) {
            const newPos = {
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
            };
            setMarker(newPos);
            onLocationSelect(newPos);
        },
    });

    useEffect(() => {
        setMarker(position);
    }, [position]);

    return marker ? (
        <Marker position={[marker.latitude, marker.longitude]} icon={stopIcon}>
            <Popup>
                <div className="text-center">
                    <strong>{stopName}</strong><br />
                    <span className="text-xs text-gray-600">
                        {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
                    </span>
                </div>
            </Popup>
        </Marker>
    ) : null;
}

const StopMapPicker = ({ isOpen, onClose, onLocationSelect, initialLocation, stopName }) => {
    const [selectedLocation, setSelectedLocation] = useState(
        initialLocation || { latitude: 9.925201, longitude: 78.119775 } // Default to Madurai
    );

    useEffect(() => {
        if (initialLocation && initialLocation.latitude && initialLocation.longitude) {
            setSelectedLocation(initialLocation);
        }
    }, [initialLocation]);

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
    };

    const handleConfirm = () => {
        onLocationSelect(selectedLocation);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    📍 Set Stop Location on Map
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {stopName ? `Setting location for: ${stopName}` : 'Click anywhere on the map to set the stop location'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="p-6">
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <i className="fas fa-info-circle text-blue-600 mt-1"></i>
                                <div className="flex-1">
                                    <p className="text-sm text-blue-900 font-medium">How to use:</p>
                                    <ul className="text-sm text-blue-800 mt-1 space-y-1">
                                        <li>• Click anywhere on the map to place the bus stop marker</li>
                                        <li>• Drag the map to navigate to different locations</li>
                                        <li>• Zoom in/out for precise positioning</li>
                                        <li>• Click "Confirm Location" when satisfied</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Map Container */}
                        <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height: '500px' }}>
                            <MapContainer
                                center={[selectedLocation.latitude, selectedLocation.longitude]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={true}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocationMarker
                                    position={selectedLocation}
                                    onLocationSelect={handleLocationSelect}
                                    stopName={stopName}
                                />
                            </MapContainer>
                        </div>

                        {/* Coordinates Display */}
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Latitude
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={selectedLocation.latitude}
                                            onChange={(e) => setSelectedLocation({
                                                ...selectedLocation,
                                                latitude: parseFloat(e.target.value) || 0
                                            })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                        <i className="fas fa-arrows-alt-v text-gray-400"></i>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Longitude
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={selectedLocation.longitude}
                                            onChange={(e) => setSelectedLocation({
                                                ...selectedLocation,
                                                longitude: parseFloat(e.target.value) || 0
                                            })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                        <i className="fas fa-arrows-alt-h text-gray-400"></i>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                💡 You can also manually adjust the coordinates above
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <i className="fas fa-check"></i>
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StopMapPicker;
