// client/src/components/Admin/BusForm.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';
import { userService } from '../../services/userService';
import useGeolocation from '../../hooks/useGeolocation';

const BusForm = ({ bus, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({
    busNumber: '',
    routeName: '',
    capacity: 40,
    status: 'active',
    driverId: '',
    latitude: 20.5937,
    longitude: 78.9629
  });
  const [errors, setErrors] = useState({});
  const { location, error: locationError, getCurrentPosition, isSupported } = useGeolocation();

  useEffect(() => {
    if (bus) {
      // Normalize bus ID - handle both id and _id
      const busId = bus.id || bus._id;

      setFormData({
        id: busId, // Store the normalized ID
        busNumber: bus.bus_number || bus.busNumber || '',
        routeName: bus.route_name || bus.routeName || '',
        capacity: bus.capacity || 40,
        status: bus.status || 'active',
        driverId: bus.driver_id || bus.driverId || '',
        latitude: bus.latitude || 20.5937,
        longitude: bus.longitude || 78.9629
      });
    }
    fetchAvailableDrivers();
    fetchRoutes();
  }, [bus]);

  const fetchAvailableDrivers = async () => {
    try {
      const response = await busService.getAvailableDrivers();
      if (response.success && response.drivers) {
        setDrivers(response.drivers);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      // Fallback to userService
      try {
        const userResponse = await userService.getAllUsers();
        if (userResponse.users) {
          const driversList = userResponse.users.filter(u => u.role === 'driver');
          setDrivers(driversList);
        }
      } catch (userError) {
        console.error('Error fetching users as drivers:', userError);
      }
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await busService.getRoutes();
      console.log('Routes response:', response);

      if (response.success && response.routes) {
        setRoutes(response.routes);
      } else if (Array.isArray(response)) {
        // Handle case where response is directly an array
        setRoutes(response);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.busNumber.trim()) newErrors.busNumber = 'Bus number is required';
    if (!formData.routeName.trim()) newErrors.routeName = 'Route name is required';
    if (formData.capacity && (formData.capacity < 1 || formData.capacity > 100)) {
      newErrors.capacity = 'Capacity must be between 1 and 100';
    }
    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Initial location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const busData = {
        busNumber: formData.busNumber,
        routeName: formData.routeName,
        capacity: parseInt(formData.capacity),
        status: formData.status,
        driverId: formData.driverId || null,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      console.log('📤 Sending bus data:', busData);

      let response;
      if (bus) {
        // Use the normalized ID from either formData or bus object
        const busId = formData.id || bus.id || bus._id;

        if (!busId) {
          setErrors({ submit: 'Cannot update: Bus ID is missing' });
          setLoading(false);
          return;
        }

        console.log(`🔄 Updating bus with ID: ${busId}`);
        response = await busService.updateBus(busId, busData);
      } else {
        console.log('➕ Creating new bus');
        response = await busService.createBus(busData);
      }

      console.log('✅ Bus save response:', response);
      console.log('   Response type:', typeof response);
      console.log('   Response.success:', response.success);
      console.log('   Response.success type:', typeof response.success);

      // More robust success detection
      const isSuccess = response && (
        response.success === true ||
        response.success === 'true' ||
        (response.bus && response.bus.id) // If we have a bus with an ID, it was created
      );

      console.log('   Is Success:', isSuccess);

      if (isSuccess) {
        console.log('✅ Calling onSuccess callback...');
        onSuccess();
      } else {
        console.error('❌ Bus save failed:', response.message || 'Unknown error');
        setErrors({ submit: response.message || 'Failed to save bus' });
      }

    } catch (error) {
      console.error('❌ Error saving bus:', error);
      setErrors({ submit: error.message || 'Failed to save bus' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Update location when geolocation is fetched
  useEffect(() => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude
      }));
    }
  }, [location]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <i className="fas fa-exclamation-circle"></i>
            <span>{errors.submit}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bus Number *
          </label>
          <input
            type="text"
            name="busNumber"
            value={formData.busNumber}
            onChange={handleChange}
            className={`block w-full px-4 py-3 border ${errors.busNumber ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            placeholder="BUS-001"
          />
          {errors.busNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.busNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capacity *
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="1"
            max="100"
            className={`block w-full px-4 py-3 border ${errors.capacity ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
          )}
        </div>
      </div>

      {/* Route Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Route *
        </label>
        <select
          name="routeName"
          value={formData.routeName}
          onChange={handleChange}
          className={`block w-full px-4 py-3 border ${errors.routeName ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        >
          <option value="">Select a route</option>
          {routes.length > 0 ? (
            routes.map(route => (
              <option key={route.id || route._id} value={route.routeName || route.name}>
                {route.routeName || route.name}
                {route.routeNumber ? ` (${route.routeNumber})` : ''}
              </option>
            ))
          ) : (
            <option value="" disabled>Loading routes...</option>
          )}
        </select>
        {errors.routeName && (
          <p className="mt-1 text-sm text-red-600">{errors.routeName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign Driver (Optional)
          </label>
          <select
            name="driverId"
            value={formData.driverId}
            onChange={handleChange}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Unassigned</option>
            {drivers.length > 0 ? (
              drivers.map(driver => (
                <option key={driver.id || driver._id} value={driver.id}>
                  {driver.name} ({driver.email})
                </option>
              ))
            ) : (
              <option value="" disabled>Loading drivers...</option>
            )}
          </select>
        </div>
      </div>

      {/* Location Management */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Initial Location</h3>
          <button
            type="button"
            onClick={getCurrentPosition}
            disabled={!isSupported}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <i className="fas fa-location-crosshairs"></i>
            Use Current Location
          </button>
        </div>

        {!isSupported && (
          <p className="text-sm text-amber-600">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            Geolocation is not supported by your browser
          </p>
        )}

        {locationError && (
          <p className="text-sm text-red-600">
            <i className="fas fa-exclamation-circle mr-1"></i>
            {locationError}
          </p>
        )}

        {location && (
          <div className="bg-green-50 p-3 rounded border border-green-200 text-sm text-green-700">
            <i className="fas fa-check-circle mr-2"></i>
            Location detected and updated
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Latitude *
            </label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              step="0.000001"
              className={`block w-full px-4 py-3 border ${errors.location ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Longitude *
            </label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              step="0.000001"
              className={`block w-full px-4 py-3 border ${errors.location ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
            />
          </div>
        </div>
        {errors.location && (
          <p className="text-sm text-red-600">{errors.location}</p>
        )}
        <p className="text-xs text-gray-500">
          Default: India center (20.5937°N, 78.9629°E). Update manually or use "Get Current Location" button.
        </p>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              {bus ? 'Update Bus' : 'Create Bus'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default BusForm;