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

// Get route stops by bus number (for driver dashboard)
router.get('/bus/:busNumber/stops', async (req, res) => {
    try {
        const { busNumber } = req.params;
        const { pool } = require('../config/db');
        console.log('🚌 Fetching route stops for bus:', busNumber);

        // First, get the route assigned to this bus
        const busRouteQuery = `
            SELECT route_name 
            FROM buses 
            WHERE bus_number = $1
        `;
        const busRouteResult = await pool.query(busRouteQuery, [busNumber]);

        if (busRouteResult.rows.length === 0) {
            console.log('⚠️ No route found for bus:', busNumber);
            return res.json({
                success: true,
                stops: [],
                message: `No route assigned to bus ${busNumber}`
            });
        }

        const routeName = busRouteResult.rows[0].route_name;
        console.log('📍 Found route:', routeName, 'for bus:', busNumber);

        // Query route_stops table
        const result = await pool.query(`
            SELECT id, stop_name as "stopName", stop_name as "name", stop_order, 
                   latitude, longitude, pickup_time as "arrivalTime", drop_time as "departureTime"
            FROM route_stops
            WHERE route_name = $1 OR route_name ILIKE $1
            ORDER BY stop_order ASC
        `, [routeName]);

        let stops = result.rows;

        if (stops.length === 0) {
            // Fallback: try to find by route name in routes table
            console.log('⚠️ No stops in route_stops table, checking routes table JSON...');
            const routeJson = await pool.query('SELECT stops FROM routes WHERE route_name = $1', [routeName]);
            if (routeJson.rows.length > 0 && routeJson.rows[0].stops) {
                stops = JSON.parse(routeJson.rows[0].stops);
            }
        }

        // Enrich stops with bus number
        const enrichedStops = stops.map(stop => ({
            ...stop,
            busNumber: busNumber,
            order: stop.stop_order || stop.order
        }));

        console.log(`✅ Found ${enrichedStops.length} stops for bus ${busNumber} (route: ${routeName})`);

        res.json({
            success: true,
            stops: enrichedStops,
            routeName: routeName,
            message: 'Route stops fetched successfully'
        });
    } catch (error) {
        console.error('❌ Error fetching route stops by bus:', error);
        res.status(500).json({
            success: false,
            stops: [],
            message: error.message
        });
    }
});

// Get real-time bus data from database
router.get('/realtime/:busNumber', async (req, res) => {
    try {
        const { busNumber } = req.params;
        const { pool } = require('../config/db');
        console.log('📡 Fetching real-time bus data for:', busNumber);

        // Query buses table for real-time data
        const result = await pool.query(`
            SELECT 
                id,
                bus_number as "busNumber",
                route_name as "routeName",
                route_name as "routeId",
                capacity,
                current_passengers as "currentPassengers",
                status,
                driver_id as "driverId",
                latitude,
                longitude,
                speed,
                trip_status as "tripStatus",
                current_stop_index as "currentStopIndex",
                delay_status as "delayStatus",
                delay_minutes as "delayMinutes",
                engine_status as "engineStatus",
                direction,
                next_stop_name as "nextStopName",
                updated_at as "lastUpdated",
                delay_reason,
                last_message_time,
                last_known_location_lat,
                last_known_location_lng,
                last_update_time,
                geofence_radius,
                next_stop_id,
                next_stop_name,
                current_trip_started_at,
                is_delayed,
                delay_minutes,
                engine_status,
                direction,
                idle_start_time,
                created_at,
                updated_at
            FROM buses 
            WHERE bus_number = $1
        `, [busNumber]);

        if (result.rows.length === 0) {
            console.log('❌ Bus not found:', busNumber);
            return res.status(404).json({
                success: false,
                message: `Bus ${busNumber} not found`
            });
        }

        const busData = result.rows[0];
        console.log('✅ Real-time bus data retrieved:', busData.bus_number);

        res.json({
            success: true,
            busData: {
                id: busData.id,
                busNumber: busData.bus_number,
                routeName: busData.route_name,
                routeId: busData.route_name, // Map as routeId for dashboard
                capacity: busData.capacity,
                currentPassengers: busData.current_passengers,
                status: busData.status,
                driverId: busData.driver_id,
                latitude: busData.latitude,
                longitude: busData.longitude,
                speed: busData.speed,
                tripStatus: busData.trip_status,
                currentStopIndex: busData.current_stop_index,
                delayStatus: busData.delay_status,
                delayMinutes: busData.delay_minutes,
                engineStatus: busData.engine_status,
                direction: busData.direction,
                nextStopName: busData.next_stop_name,
                idleStartTime: busData.idle_start_time,
                lastUpdated: busData.updated_at,
                lastUpdateTime: busData.last_update_time,
                geofenceRadius: busData.geofence_radius,
                nextStopId: busData.next_stop_id,
                currentTripStartedAt: busData.current_trip_started_at,
                isDelayed: busData.is_delayed,
                createdAt: busData.created_at,
                updatedAt: busData.updated_at
            },
            message: 'Real-time bus data retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error fetching real-time bus data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch real-time bus data',
            error: error.message
        });
    }
});

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