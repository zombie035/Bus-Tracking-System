// client/src/components/Driver/AssignedRouteCard.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const AssignedRouteCard = () => {
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetchRoute();
    }, []);

    const fetchRoute = async () => {
        try {
            const response = await busService.getAssignedRoute();
            if (response.success && response.route) {
                setRoute(response.route);
            }
        } catch (error) {
            console.error('Error fetching route:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-route text-gray-400 text-2xl"></i>
                    </div>
                    <p className="text-gray-600 font-medium">No route assigned</p>
                    <p className="text-sm text-gray-500 mt-1">Contact admin for route assignment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                            <i className="fas fa-map-marked-alt text-xl"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{route.routeName}</h3>
                            <p className="text-sm text-gray-600">Bus: {route.busNumber}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{route.totalStops}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Stops</div>
                    </div>
                </div>

                {/* Route Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-route text-blue-600"></i>
                            <div>
                                <div className="text-xs text-gray-600">Total Distance</div>
                                <div className="text-lg font-bold text-gray-900">
                                    {route.totalDistance ? `${route.totalDistance} km` : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-map-pin text-indigo-600"></i>
                            <div>
                                <div className="text-xs text-gray-600">Route Stops</div>
                                <div className="text-lg font-bold text-gray-900">{route.totalStops}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stops List */}
            <div className="p-4">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors mb-3"
                >
                    <span className="font-semibold text-gray-900">
                        <i className="fas fa-list-ul mr-2 text-blue-600"></i>
                        View All Stops
                    </span>
                    <i className={`fas fa-chevron-${expanded ? 'up' : 'down'} text-gray-600 transition-transform`}></i>
                </button>

                {expanded && (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {route.stops?.map((stop, index) => (
                            <div
                                key={stop.id}
                                className="flex items-start gap-3 p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                            >
                                {/* Stop Number */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow">
                                    {index + 1}
                                </div>

                                {/* Stop Details */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 mb-1">{stop.stopName}</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        {stop.pickupTime && (
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-clock text-blue-600 w-4"></i>
                                                <span>Pickup: {stop.pickupTime}</span>
                                            </div>
                                        )}
                                        {stop.dropTime && (
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-clock text-orange-600 w-4"></i>
                                                <span>Drop: {stop.dropTime}</span>
                                            </div>
                                        )}
                                        {stop.latitude && stop.longitude && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <i className="fas fa-map-marker-alt w-4"></i>
                                                <span>{parseFloat(stop.latitude).toFixed(4)}, {parseFloat(stop.longitude).toFixed(4)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Distance Indicator */}
                                {index < route.stops.length - 1 && (
                                    <div className="flex-shrink-0">
                                        <i className="fas fa-arrow-down text-gray-400"></i>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Action */}
                {!expanded && route.stops && route.stops.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-blue-800">
                                <i className="fas fa-info-circle"></i>
                                <span className="font-medium">Next Stop:</span>
                            </div>
                            <span className="font-bold text-blue-900">{route.stops[0].stopName}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignedRouteCard;
