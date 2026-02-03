const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrateStops() {
    console.log('🚀 Starting route stops migration...');
    try {
        // 1. Get all routes
        const routesRes = await pool.query('SELECT route_name, stops FROM routes');
        console.log(`found ${routesRes.rows.length} routes to process.`);

        for (const route of routesRes.rows) {
            console.log(`\n🔄 Processing route: "${route.route_name}"...`);
            let stops = [];
            try {
                stops = JSON.parse(route.stops);
            } catch (e) {
                console.warn(`   ⚠️ Invalid JSON for stops: ${e.message}`);
                continue;
            }

            if (!stops || stops.length === 0) {
                console.log('   ℹ️  No stops defined.');
                continue;
            }

            console.log(`   Found ${stops.length} stops in JSON. Syncing to table...`);

            // Clear old
            await pool.query('DELETE FROM route_stops WHERE route_name = $1', [route.route_name]);

            // Insert new
            let count = 0;
            for (let i = 0; i < stops.length; i++) {
                const stop = stops[i];
                if (!stop.name || !stop.latitude || !stop.longitude) continue;

                await pool.query(
                    `INSERT INTO route_stops 
                     (route_name, stop_name, stop_order, latitude, longitude, pickup_time, drop_time)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        route.route_name,
                        stop.name,
                        i + 1,
                        stop.latitude,
                        stop.longitude,
                        stop.arrivalTime || null,
                        stop.departureTime || null
                    ]
                );
                count++;
            }
            console.log(`   ✅ Synced ${count} stops.`);
        }

        console.log('\n✨ Migration complete!');
        await pool.end();

    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrateStops();
