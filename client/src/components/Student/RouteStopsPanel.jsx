// client/src/components/Student/RouteStopsPanel.jsx
import React, { useState, useEffect } from 'react';

const RouteStopsPanel = ({ stops, currentBusLocation, boardingStop, droppingStop, onStopClick }) => {
    const [currentStopIndex, setCurrentStopIndex] = useState(-1);

    // Determine current stop based on bus location
    useEffect(() => {
        if (!currentBusLocation || !stops || stops.length === 0) return;

        // Find closest stop to bus
        let closestIndex = 0;
        let minDistance = Infinity;

        stops.forEach((stop, index) => {
            if (stop.latitude && stop.longitude) {
                const distance = calculateDistance(
                    currentBusLocation.latitude,
                    currentBusLocation.longitude,
                    parseFloat(stop.latitude),
                    parseFloat(stop.longitude)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                }
            }
        });

        setCurrentStopIndex(closestIndex);
    }, [currentBusLocation, stops]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const getStopStatus = (index, stopName) => {
        if (index === currentStopIndex) return 'current';
        if (index < currentStopIndex) return 'passed';
        // Highlight user's boarding and dropping stops
        if (stopName === boardingStop || stopName === droppingStop) return 'user';
        return 'upcoming';
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch {
            return timeString;
        }
    };

    if (!stops || stops.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Stops</h3>
                <p className="text-gray-600 text-center py-8">No route stops available</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Route Stops</h3>
                <span className="text-sm text-gray-600">{stops.length} stops</span>
            </div>

            <div className="space-y-3">
                {stops.map((stop, index) => {
                    const stopName = stop.stopName || stop.name;
                    const status = getStopStatus(index, stopName);
                    const isUserStop = stopName === boardingStop || stopName === droppingStop;

                    return (
                        <div
                            key={index}
                            onClick={() => onStopClick && onStopClick(stop)}
                            className={`relative pl-6 pb-3 cursor-pointer hover:bg-gray-50 transition-colors ${index < stops.length - 1 ? 'border-l-2' : ''
                                } ${status === 'passed' ? 'border-gray-300' :
                                    status === 'current' ? 'border-green-500' :
                                        'border-blue-300'
                                }`}
                        >
                            {/* Stop indicator */}
                            <div
                                className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 ${status === 'passed' ? 'bg-gray-400 border-gray-400' :
                                    status === 'current' ? 'bg-green-500 border-green-500 animate-pulse' :
                                        isUserStop ? 'bg-yellow-400 border-yellow-400' :
                                            'bg-white border-blue-400'
                                    }`}
                            />

                            {/* Stop info */}
                            <div className={`rounded-lg p-3 ${status === 'current' ? 'bg-green-50 border border-green-200' :
                                isUserStop ? 'bg-yellow-50 border border-yellow-200' :
                                    'bg-gray-50'
                                }`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-medium ${status === 'passed' ? 'text-gray-600' :
                                                status === 'current' ? 'text-green-900' :
                                                    'text-gray-900'
                                                }`}>
                                                {stopName}
                                            </p>
                                            {status === 'current' && (
                                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                                                    Current
                                                </span>
                                            )}
                                            {stop.stopName === boardingStop && (
                                                <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                                                    📍 Boarding
                                                </span>
                                            )}
                                            {stop.stopName === droppingStop && (
                                                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                                                    🏁 Dropping
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                                            <span>
                                                <i className="fas fa-arrow-up text-green-600 mr-1"></i>
                                                {formatTime(stop.pickupTime)}
                                            </span>
                                            <span>
                                                <i className="fas fa-arrow-down text-blue-600 mr-1"></i>
                                                {formatTime(stop.dropTime)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">#{stop.stopOrder}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-gray-600">Passed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-gray-600">Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span className="text-gray-600">Your Stop</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white border-2 border-blue-400"></div>
                    <span className="text-gray-600">Upcoming</span>
                </div>
            </div>
        </div>
    );
};

export default RouteStopsPanel;