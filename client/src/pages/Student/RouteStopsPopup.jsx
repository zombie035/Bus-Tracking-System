// client/src/pages/Student/RouteStopsPopup.jsx
import React from 'react';
import { 
  XMarkIcon, 
  MinusIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  MapPinIcon,
  ClockIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

const RouteStopsPopup = ({ 
  isOpen, 
  onClose, 
  isMaximized, 
  isMinimized, 
  toggleMaximize, 
  toggleMinimize,
  routeStops,
  busRoutes,
  selectedRoute,
  setSelectedRoute,
  userProfile
}) => {
  if (!isOpen && !isMinimized) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50 bg-black/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-gray-800 transition-all duration-300 hover:scale-105">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-medium">Route Stops</span>
          <button
            onClick={() => toggleMinimize('routeStops')}
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
      isMaximized ? 'bg-black/50' : 'bg-black/30'
    }`}>
      <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
        isMaximized ? 'w-full h-full max-w-6xl' : 'w-full max-w-2xl max-h-[80vh]'
      }`}>
        {/* Header */}
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Route Stops</h2>
            <p className="text-gray-300 text-sm mt-1">
              {selectedRoute?.name || 'Select a route'} • {routeStops?.length || 0} stops
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleMaximize('routeStops')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMaximized ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => toggleMinimize('routeStops')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <MinusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: isMaximized ? 'calc(100vh - 120px)' : '60vh' }}>
          {/* Student Profile Info */}
          {userProfile && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">Student Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{userProfile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="font-medium text-gray-900">{userProfile.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{userProfile.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-medium text-gray-900">{userProfile.year}</p>
                </div>
              </div>
            </div>
          )}

          {/* Route Selection */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Select Route</h3>
            <div className="grid grid-cols-1 gap-3">
              {busRoutes.map(route => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedRoute?.id === route.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-medium">{route.name}</p>
                      <p className="text-sm opacity-80">{route.busNumber}</p>
                    </div>
                    {route.active && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Route Stops List */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Route Stops</h3>
            <div className="space-y-3">
              {routeStops.map((stop, index) => (
                <div
                  key={stop.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    stop.status === 'current'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{stop.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <ClockIcon className="w-4 h-4" />
                            {stop.time}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPinIcon className="w-4 h-4" />
                            {stop.distance}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {stop.status === 'current' && (
                        <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs rounded-full">
                          Current Stop
                        </span>
                      )}
                      {stop.status === 'upcoming' && (
                        <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Statistics */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{routeStops.length}</p>
              <p className="text-sm text-gray-600">Total Stops</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {routeStops.filter(s => s.status === 'current').length}
              </p>
              <p className="text-sm text-gray-600">Current Stop</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {routeStops.filter(s => s.status === 'upcoming').length}
              </p>
              <p className="text-sm text-gray-600">Upcoming</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteStopsPopup;
