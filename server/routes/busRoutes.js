// routes/busRoutes.js
const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// ========== PUBLIC ROUTES ==========
// These endpoints are for public consumption (e.g., by students or a public map)
// and do not require admin authentication.
router.get('/', busController.getBuses);
router.get('/live', busController.getLiveBuses);
router.get('/:id', busController.getBus);

// Get route stops by route ID or name (for driver dashboard)
// Get route stops by route ID or name (for driver dashboard)
router.get('/routes/:routeId/stops', async (req, res) => {
    try {
        const { routeId } = req.params;
        const { pool } = require('../config/db');
        console.log('🗺️ Fetching route stops for:', routeId);

        let routeName = routeId;

        // If routeId looks like a UUID or numeric ID, lookup the name from ROUTES table
        // Simple check: if it doesn't contain letters, or is a UUID
        if (routeId.match(/^[0-9a-fA-F-]{36}$/) || !isNaN(routeId)) {
            const routeRes = await pool.query('SELECT route_name FROM routes WHERE id = $1', [routeId]);
            if (routeRes.rows.length > 0) {
                routeName = routeRes.rows[0].route_name;
            }
        }

        // Query route_stops table
        const result = await pool.query(`
            SELECT id, stop_name as "stopName", stop_name as "name", stop_order, 
                   latitude, longitude, pickup_time as "arrivalTime", drop_time as "departureTime"
            FROM route_stops
            WHERE route_name = $1 OR route_name ILIKE $1
            ORDER BY stop_order ASC
        `, [routeName]);

        let stops = result.rows;
        let routePath = [];

        if (stops.length === 0) {
            // Fallback: try to find by ID in routes table
            console.log('⚠️ No stops in route_stops table, checking routes table JSON...');
            const routeJson = await pool.query('SELECT stops FROM routes WHERE route_name = $1', [routeName]);
            if (routeJson.rows.length > 0 && routeJson.rows[0].stops) {
                stops = JSON.parse(routeJson.rows[0].stops);
            }
        }

        // Calculate Route Path if we have enough stops
        if (stops.length >= 2) {
            try {
                console.log('🛣️ Calculating path for stops:', stops.length);
                const routeCalculator = require('../utils/routeCalculator');
                const start = stops[0];
                const end = stops[stops.length - 1];
                // Convert stops to format expected by RouteCalculator [lng, lat]
                // Note: routeCalculator expects intermediate stops as waypoints
                // RouteCalculator expects waypoints for all stops (including start/end sometimes, but typically intermediate)
                // Let's pass ALL stops as waypoints to be safe, logic inside routeCalculator handles it?
                // Checking routeCalculator.js usage from debug-route.js:
                // calculateRoute(startLat, startLng, endLat, endLng, waypoints)
                // waypoints = [[lng, lat]]

                const waypoints = stops.map(s => [parseFloat(s.longitude), parseFloat(s.latitude)]);
                console.log('📍 Waypoints (first 3):', JSON.stringify(waypoints.slice(0, 3)));

                // Calculate
                const pathData = await routeCalculator.calculateRoute(
                    { lat: start.latitude, lng: start.longitude },
                    { lat: end.latitude, lng: end.longitude },
                    waypoints // passing all stops as waypoints
                );

                if (pathData && pathData.geometry && pathData.geometry.coordinates) {
                    // OpenRouteService returns [lng, lat], we need [lat, lng] for Leaflet
                    routePath = pathData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    console.log(`✅ Calculated route path with ${routePath.length} points for ${routeName}`);
                } else {
                    console.warn('⚠️ Path calculation returned no coordinates:', pathData);
                }
            } catch (calcError) {
                console.error('⚠️ Failed to calculate detailed path:', calcError.message);
                if (calcError.response) console.error('   API Error:', calcError.response.data);
                // Fallback to straight lines is implicit if routePath is empty
            }
        } else {
            console.log('⚠️ Not enough stops for path calculation:', stops.length);
        }

        res.json({
            success: true,
            stops: stops,
            routePath: routePath,
            message: 'Route stops fetched successfully'
        });
    } catch (error) {
        console.error('Error fetching route stops:', error);
        res.status(500).json({ success: false, stops: [], message: error.message });
    }
});

module.exports = router;