const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function fetchPudurStops() {
    console.log('🔍 Fetching stops for route: "pudur"...');
    try {
        const res = await pool.query(`
            SELECT stop_name, latitude, longitude, stop_order, pickup_time 
            FROM route_stops 
            WHERE LOWER(route_name) = LOWER($1)
            ORDER BY stop_order ASC
        `, ['pudur']);

        if (res.rows.length === 0) {
            console.log('❌ No stops found for route "pudur".');

            // Check what routes DO exist
            const routes = await pool.query('SELECT DISTINCT route_name FROM route_stops');
            console.log('ℹ️  Available routes:', routes.rows.map(r => r.route_name).join(', '));

            // Check if it's a STOP name
            console.log('🔍 Checking if "pudur" is a stop name...');
            const stopRes = await pool.query(`
                SELECT stop_name, route_name, latitude, longitude 
                FROM route_stops 
                WHERE stop_name ILIKE $1
            `, ['%pudur%']);

            if (stopRes.rows.length > 0) {
                console.log(`✅ Found ${stopRes.rows.length} stops matching "pudur":`);
                stopRes.rows.forEach(stop => {
                    console.log(`   Stop: "${stop.stop_name}" on Route: "${stop.route_name}" (${stop.latitude}, ${stop.longitude})`);
                });
            } else {
                console.log('❌ "pudur" not found as a route OR a stop.');
            }
        } else {
            console.log(`✅ Found ${res.rows.length} stops for "pudur":`);
            res.rows.forEach(stop => {
                console.log(`   ${stop.stop_order}. ${stop.stop_name} (${stop.latitude}, ${stop.longitude})`);
            });
        }

        await pool.end();
    } catch (error) {
        console.error('❌ DB Error:', error.message);
    }
}

fetchPudurStops();
