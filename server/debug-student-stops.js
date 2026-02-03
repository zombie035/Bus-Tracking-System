const { pool } = require('./config/db');
const Bus = require('./models/Bus');
const User = require('./models/User'); // Mongoose model... wait, studentController uses User.findById (Mongoose) AND pool.query (PG)?
// studentController.js imports: const Bus = require('../models/Bus'); (Mongoose?)
// const User = require('../models/User'); (Mongoose?)
// But getMyRouteStops uses: const { pool } = require('../config/db'); (PG)
// And queries User.findById (Mongoose)
// This hybrid approach is risky if I don't set up Mongoose connection in debug script.

// I will mock the user/bus lookup and focus on the PG query + Route Calculation part which is the core logic I changed.

const routeCalculator = require('./utils/routeCalculator');
require('dotenv').config();

async function debugStudentStops() {
    try {
        console.log('🔍 Debugging Student Route Stops...');

        // Mock Data based on previous debugs
        const busNumber = "121";
        const routeName = "pudur";
        console.log(`   Simulating for Bus: ${busNumber}, Route: ${routeName}`);

        // 1. Fetch stops from PG
        console.log('1. Fetching stops from DB...');
        const result = await pool.query(
            `SELECT id, stop_name as "stopName", stop_order as "stopOrder", 
              latitude, longitude, pickup_time as "pickupTime", drop_time as "dropTime"
       FROM route_stops 
       WHERE route_name = $1 
       ORDER BY stop_order ASC`,
            [routeName]
        );

        console.log(`   Found ${result.rows.length} stops.`);
        const stops = result.rows;

        // 2. Calculate Path
        if (stops.length >= 2) {
            console.log(`2. Calculating path using routeCalculator...`);
            const start = stops[0];
            const end = stops[stops.length - 1];

            const waypoints = stops.map(s => [parseFloat(s.longitude), parseFloat(s.latitude)]);

            const pathData = await routeCalculator.calculateRoute(
                { lat: parseFloat(start.latitude), lng: parseFloat(start.longitude) },
                { lat: parseFloat(end.latitude), lng: parseFloat(end.longitude) },
                waypoints
            );

            if (pathData && pathData.geometry && pathData.geometry.coordinates) {
                console.log(`   ✅ Success! Path contains ${pathData.geometry.coordinates.length} points.`);
            } else {
                console.log('   ⚠️ Path calculation returned no coordinates:', pathData);
            }
        } else {
            console.log('   ⚠️ Not enough stops to calculate path.');
        }

    } catch (err) {
        console.error('❌ CRASHED:', err);
    } finally {
        pool.end();
    }
}

debugStudentStops();
