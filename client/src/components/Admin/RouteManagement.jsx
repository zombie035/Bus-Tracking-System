// client/src/components/Admin/RouteManagement.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal from '../UI/Modal';
import routeService from '../../services/routeService';
import StopMapPicker from './StopMapPicker';

const RouteManagement = () => {
  console.log('🚀 RouteManagement component mounted');

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [expandedRoutes, setExpandedRoutes] = useState(new Set());
  const [editingStops, setEditingStops] = useState(null);

  // Map picker state
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedStopIndex, setSelectedStopIndex] = useState(null);

  const [formData, setFormData] = useState({
    routeName: '',
    routeNumber: '',
    startingPoint: '',
    destinationPoint: '',
    stops: []
  });

  useEffect(() => {
    console.log('🔄 RouteManagement useEffect triggered');
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await routeService.getRoutes();
      if (response.success) {
        setRoutes(response.routes);
      } else {
        toast.error('Failed to fetch routes');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Error loading routes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Form submitted with data:', formData);

    try {
      let response;
      if (editingRoute) {
        console.log('📝 Updating route:', editingRoute.id);
        response = await routeService.updateRoute(editingRoute.id, formData);
      } else {
        console.log('➕ Creating new route');
        response = await routeService.createRoute(formData);
      }

      console.log('📡 API Response:', response);

      if (response.success) {
        toast.success(`Route ${editingRoute ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        resetForm();
        fetchRoutes();
      } else {
        toast.error(response.message || 'Failed to save route');
      }
    } catch (error) {
      console.error('❌ Error saving route:', error);
      toast.error('Error saving route');
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      routeName: route.routeName,
      routeNumber: route.routeNumber || '',
      startingPoint: route.startingPoint,
      destinationPoint: route.destinationPoint,
      stops: route.stops || []
    });
    setShowModal(true);
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) {
      return;
    }

    try {
      const response = await routeService.deleteRoute(routeId);
      if (response.success) {
        toast.success('Route deleted successfully');
        fetchRoutes();
      } else {
        toast.error('Failed to delete route');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Error deleting route');
    }
  };

  const resetForm = () => {
    setFormData({
      routeName: '',
      routeNumber: '',
      startingPoint: '',
      destinationPoint: '',
      stops: []
    });
    setEditingRoute(null);
  };

  const addStop = () => {
    setFormData(prev => ({
      ...prev,
      stops: [...prev.stops, {
        name: '',
        arrivalTime: '',
        departureTime: '',
        latitude: null,
        longitude: null
      }]
    }));
  };

  const updateStop = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.map((stop, i) =>
        i === index ? { ...stop, [field]: value } : stop
      )
    }));
  };

  const removeStop = (index) => {
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
  };

  // Open map picker for a specific stop
  const openMapPicker = (index) => {
    setSelectedStopIndex(index);
    setShowMapPicker(true);
  };

  // Handle location selection from map
  const handleLocationSelect = (location) => {
    if (selectedStopIndex !== null) {
      updateStop(selectedStopIndex, 'latitude', location.latitude);
      updateStop(selectedStopIndex, 'longitude', location.longitude);
    }
  };

  const filteredRoutes = routes.filter(route =>
    route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (route.routeNumber && route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Toggle route expansion
  const toggleRouteExpansion = (routeId) => {
    const newExpanded = new Set(expandedRoutes);
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId);
    } else {
      newExpanded.add(routeId);
    }
    setExpandedRoutes(newExpanded);
  };

  // Start editing stops for a route
  const startEditingStops = (route) => {
    setEditingStops({
      routeId: route.id,
      stops: [...(route.stops || [])]
    });
  };

  // Cancel editing stops
  const cancelEditingStops = () => {
    setEditingStops(null);
  };

  // Move stop up
  const moveStopUp = (index) => {
    if (index > 0 && editingStops) {
      const newStops = [...editingStops.stops];
      [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
      setEditingStops({ ...editingStops, stops: newStops });
    }
  };

  // Move stop down
  const moveStopDown = (index) => {
    if (editingStops && index < editingStops.stops.length - 1) {
      const newStops = [...editingStops.stops];
      [newStops[index], newStops[index + 1]] = [newStops[index + 1], newStops[index]];
      setEditingStops({ ...editingStops, stops: newStops });
    }
  };

  // Save reordered stops
  const saveStopOrder = async () => {
    if (!editingStops) return;

    try {
      const response = await routeService.updateRoute(editingStops.routeId, {
        stops: editingStops.stops
      });

      if (response.success) {
        toast.success('Stop order updated successfully');
        setEditingStops(null);
        fetchRoutes();
      } else {
        toast.error('Failed to update stop order');
      }
    } catch (error) {
      console.error('Error updating stop order:', error);
      toast.error('Error updating stop order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-600">Manage bus routes and stops</p>
        </div>
        <button
          onClick={() => {
            console.log('🔘 Add Route button clicked');
            resetForm();
            setShowModal(true);
            console.log('📂 Modal should now be open:', true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Add Route
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={fetchRoutes}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <i className="fas fa-refresh"></i>
        </button>
      </div>

      {/* Routes Dashboard */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading routes...</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No routes found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRoutes.map((route) => (
              <div key={route.id} className="p-6">
                {/* Route Header */}
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => toggleRouteExpansion(route.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`transform transition-transform ${expandedRoutes.has(route.id) ? 'rotate-90' : ''}`}>
                      <i className="fas fa-chevron-right text-gray-400"></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {route.routeName}
                      </h3>
                      {route.routeNumber && (
                        <p className="text-sm text-gray-500">
                          Route #{route.routeNumber}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {route.startingPoint} → {route.destinationPoint}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {route.stops?.length || 0} stops
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(route);
                        }}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <i className="fas fa-edit mr-1"></i>Edit Route
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(route.id);
                        }}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        <i className="fas fa-trash mr-1"></i>Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedRoutes.has(route.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {editingStops && editingStops.routeId === route.id ? (
                      /* Edit Mode */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium text-gray-900">Edit Stop Order</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={cancelEditingStops}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveStopOrder}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Save Order
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {editingStops.stops.map((stop, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => moveStopUp(index)}
                                  disabled={index === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <i className="fas fa-chevron-up"></i>
                                </button>
                                <button
                                  onClick={() => moveStopDown(index)}
                                  disabled={index === editingStops.stops.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <i className="fas fa-chevron-down"></i>
                                </button>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  Stop {index + 1}: {stop.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Arrival: {stop.arrivalTime || 'N/A'} | Departure: {stop.departureTime || 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium text-gray-900">Route Stops</h4>
                          {route.stops && route.stops.length > 0 && (
                            <button
                              onClick={() => startEditingStops(route)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              <i className="fas fa-arrows-alt mr-1"></i>Reorder Stops
                            </button>
                          )}
                        </div>
                        {route.stops && route.stops.length > 0 ? (
                          <div className="space-y-2">
                            {route.stops.map((stop, index) => (
                              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0 w-16 text-center">
                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {stop.name}
                                  </div>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">Arrival:</span> {stop.arrivalTime || 'N/A'}
                                  </div>
                                  <div>
                                    <span className="font-medium">Departure:</span> {stop.departureTime || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <i className="fas fa-map-marker-alt text-3xl mb-2"></i>
                            <p>No stops defined for this route</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingRoute ? 'Edit Route' : 'Add New Route'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Name *
              </label>
              <input
                type="text"
                value={formData.routeName}
                onChange={(e) => setFormData(prev => ({ ...prev, routeName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Number
              </label>
              <input
                type="text"
                value={formData.routeNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, routeNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Point *
              </label>
              <input
                type="text"
                value={formData.startingPoint}
                onChange={(e) => setFormData(prev => ({ ...prev, startingPoint: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Point *
              </label>
              <input
                type="text"
                value={formData.destinationPoint}
                onChange={(e) => setFormData(prev => ({ ...prev, destinationPoint: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Stops Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Stops
              </label>
              <button
                type="button"
                onClick={addStop}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
              >
                <i className="fas fa-plus mr-1"></i>Add Stop
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {formData.stops.map((stop, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  {/* Stop Name and Times Row */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Stop name"
                        value={stop.name}
                        onChange={(e) => updateStop(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="time"
                        placeholder="Arrival"
                        value={stop.arrivalTime}
                        onChange={(e) => updateStop(index, 'arrivalTime', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="time"
                        placeholder="Departure"
                        value={stop.departureTime}
                        onChange={(e) => updateStop(index, 'departureTime', e.target.value)}
                        className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Remove stop"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>

                  {/* Coordinates Row */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openMapPicker(index)}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                      title="Set location on map"
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      Set on Map
                    </button>

                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="Latitude"
                          value={stop.latitude || ''}
                          onChange={(e) => updateStop(index, 'latitude', parseFloat(e.target.value) || null)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="0.000001"
                          placeholder="Longitude"
                          value={stop.longitude || ''}
                          onChange={(e) => updateStop(index, 'longitude', parseFloat(e.target.value) || null)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Coordinate status indicator */}
                    {stop.latitude && stop.longitude && (
                      <div className="flex-shrink-0 text-green-600" title="Location set">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    )}
                  </div>

                  {/* Coordinate display helper text */}
                  {stop.latitude && stop.longitude && (
                    <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                      <i className="fas fa-location-dot text-blue-500"></i>
                      <span>📍 {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingRoute ? 'Update Route' : 'Create Route'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Map Picker Modal */}
      <StopMapPicker
        isOpen={showMapPicker}
        onClose={() => {
          setShowMapPicker(false);
          setSelectedStopIndex(null);
        }}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          selectedStopIndex !== null && formData.stops[selectedStopIndex]
            ? {
              latitude: formData.stops[selectedStopIndex].latitude || 9.925201,
              longitude: formData.stops[selectedStopIndex].longitude || 78.119775
            }
            : { latitude: 9.925201, longitude: 78.119775 }
        }
        stopName={
          selectedStopIndex !== null && formData.stops[selectedStopIndex]
            ? formData.stops[selectedStopIndex].name || `Stop ${selectedStopIndex + 1}`
            : 'New Stop'
        }
      />
    </div>
  );
};

export default RouteManagement;
