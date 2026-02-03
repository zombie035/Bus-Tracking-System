const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function fetchBusDetails() {
    console.log('🔍 Searching for Bus Number: "121"...');
    try {
        // 1. Find the bus and its route name
        const busRes = await pool.query(`
            SELECT id, bus_number, route_name 
            FROM buses 
            WHERE bus_number = $1
        `, ['121']);

        if (busRes.rows.length === 0) {
            console.log('❌ Bus "121" not found in the database.');
            // List available buses
            const allBuses = await pool.query('SELECT bus_number, route_name FROM buses LIMIT 5');
            console.log('ℹ️  Some available buses:', allBuses.rows.map(b => `${b.bus_number} (${b.route_name})`).join(', '));
            await pool.end();
            return;
        }

        const bus = busRes.rows[0];
        console.log(`✅ Found Bus 121!`);
        console.log(`   Route Name: "${bus.route_name}"`);

        if (!bus.route_name) {
            console.log('⚠️ Bus 121 has no route assigned.');
            await pool.end();
            return;
        }

        // 2. Fetch stops for this route
        console.log(`\n🛑 Fetching stops for route "${bus.route_name}"...`);
        const stopsRes = await pool.query(`
            SELECT stop_order, stop_name, latitude, longitude, pickup_time 
            FROM route_stops 
            WHERE route_name = $1 
            ORDER BY stop_order ASC
        `, [bus.route_name]);

        if (stopsRes.rows.length === 0) {
            console.log(`⚠️ No stops found for route "${bus.route_name}".`);
        } else {
            console.log(`✅ Found ${stopsRes.rows.length} stops:\n`);
            stopsRes.rows.forEach(stop => {
                console.log(`   ${stop.stop_order}. ${stop.stop_name}`);
                console.log(`      📍 ${stop.latitude}, ${stop.longitude}`);
                console.log(`      🕒 Pickup: ${stop.pickup_time}`);
                console.log('      -------------------');
            });
        }

        await pool.end();
    } catch (error) {
        console.error('❌ DB Error:', error.message);
    }
}

fetchBusDetails();
