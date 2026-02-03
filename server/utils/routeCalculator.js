const axios = require('axios');
require('dotenv').config();

class RouteCalculator {
  constructor() {
    // Try loading env from default location, or specific paths if needed
    if (!process.env.OPENROUTE_API_KEY) {
      require('dotenv').config();
      // Fallback for when running from root but env is in server/
      if (!process.env.OPENROUTE_API_KEY) {
        require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
      }
    }

    this.apiKey = process.env.OPENROUTE_API_KEY;
    this.baseUrl = 'https://api.openrouteservice.org/v2';

    // Check for API key
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouteService API key not found in routeCalculator.');
      // Don't throw here, allow fallback to work
    } else {
      console.log('✅ OpenRouteService initialized with API Key');
    }
  }

  // Calculate road distance and route between two points
  // start: { lat, lng }, end: { lat, lng }, waypoints: [[lng, lat], ...]
  async calculateRoute(start, end, waypoints = [], profile = 'driving-car') {
    try {
      // Check if API key exists
      if (!this.apiKey) {
        console.log('No API key, using straight-line distance');
        return this.calculateStraightLineDistance(start, end);
      }

      console.log('Calculating road route (POST/GeoJSON) with waypoints:', waypoints.length);

      const url = `${this.baseUrl}/directions/${profile}/geojson`;

      // Construct coordinates array: Start -> Waypoints -> End
      // Ensure start/end are [lng, lat] arrays
      const startCoord = [parseFloat(start.lng || start.longitude), parseFloat(start.lat || start.latitude)];
      const endCoord = [parseFloat(end.lng || end.longitude), parseFloat(end.lat || start.latitude)];

      let coordinates = [startCoord];

      if (waypoints && waypoints.length > 0) {
        // Verify waypoints format
        if (Array.isArray(waypoints[0])) {
          coordinates = [...coordinates, ...waypoints];
        } else {
          // Assume {lat, lng} objects if not arrays
          coordinates = [...coordinates, ...waypoints.map(w => [w.lng || w.longitude, w.lat || w.latitude])];
        }
      }

      // ORS expects start and end to be explicitly in the coordinates list if provided
      // If waypoints INCLUDE start/end, we should handle that. 
      // Current usage in busRoutes.js passes ALL stops as waypoints.
      // If we pass [Start, ...Intermediates, End] as waypoints, we should just use waypoints as coordinates.

      if (waypoints.length >= 2) {
        // If 2 or more waypoints are passed, assume they form the complete path
        // Ensure conversion to [lng, lat] arrays
        if (Array.isArray(waypoints[0])) {
          coordinates = waypoints;
        } else {
          coordinates = waypoints.map(w => [parseFloat(w.lng || w.longitude), parseFloat(w.lat || w.latitude)]);
        }
      } else {
        coordinates.push(endCoord);
      }

      console.log(`Sending ${coordinates.length} coordinates to ORS`);

      const response = await axios.post(
        url,
        {
          coordinates: coordinates,
          preference: 'fastest', // Explicitly prefer fastest route (usually main roads)
          // instructions: false,
          // options: { avoid_features: ['unpaved'] } 
        },
        {
          headers: {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            'Authorization': this.apiKey,
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      );

      if (response.data && response.data.features && response.data.features[0]) {
        const route = response.data.features[0];

        return {
          success: true,
          distance: route.properties.summary.distance / 1000, // Convert meters to km
          duration: route.properties.summary.duration / 60,   // Convert seconds to minutes
          geometry: route.geometry,  // GeoJSON line string for map
          coordinates: this.decodePolyline(route.geometry.coordinates),
          bbox: route.bbox
        };
      }

      throw new Error('No route found');

    } catch (error) {
      console.error('❌ Route calculation error:', error.message);
      if (error.response) {
        console.error('🔴 ORS API Response:', JSON.stringify(error.response.data));
      }

      // Fallback to straight-line distance
      return {
        ...this.calculateStraightLineDistance(start, end),
        success: false,
        error: error.message
      };
    }
  }

  // Fallback: Calculate straight-line distance (Haversine formula)
  calculateStraightLineDistance(start, end) {
    const R = 6371; // Earth's radius in km

    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLon = (end.lng - start.lng) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate duration (assuming 30 km/h average speed)
    const duration = (distance / 30) * 60;

    return {
      success: true,
      distance: distance,
      duration: duration,
      geometry: null,
      coordinates: [
        { lat: start.lat, lng: start.lng },
        { lat: end.lat, lng: end.lng }
      ],
      isStraightLine: true
    };
  }

  // Decode polyline coordinates for Leaflet
  decodePolyline(coordinates) {
    return coordinates.map(coord => ({
      lat: coord[1],  // Latitude
      lng: coord[0]   // Longitude
    }));
  }

  // Calculate ETA based on distance and average speed
  calculateETA(distanceKm, speedKmh = 30) {
    const hours = distanceKm / speedKmh;
    const minutes = Math.round(hours * 60);

    return {
      minutes: minutes,
      hours: hours.toFixed(1),
      distance: distanceKm.toFixed(2)
    };
  }
}

module.exports = new RouteCalculator();