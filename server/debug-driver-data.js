const { Pool } = require('pg');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function debugDriverData() {
    console.log('🔍 Debugging Driver -> Bus -> Route link...');
    try {
        // 1. Check Buses and their Routes
        const busRes = await pool.query('SELECT id, bus_number, route_name, driver_id FROM buses');
        console.log('🚌 Buses in DB:');
        busRes.rows.forEach(b => {
            console.log(`   - Bus ${b.bus_number} (ID: ${b.id}) -> Route: "${b.route_name}" | Driver: ${b.driver_id || 'None'}`);
        });

        // 2. Pick the first bus with a route (likely "pudur")
        const targetBus = busRes.rows.find(b => b.route_name);
        if (!targetBus) {
            console.log('❌ No buses found with a route assigned!');
            await pool.end();
            return;
        }

        console.log(`\n🎯 Testing API for Route: "${targetBus.route_name}"`);

        // 3. Simulate API call to the NEW endpoint
        const url = `http://localhost:${process.env.PORT || 5000}/api/buses/routes/${encodeURIComponent(targetBus.route_name)}/stops`;
        console.log(`   GET ${url}`);

        try {
            const apiRes = await axios.get(url);
            console.log('✅ API Response Status:', apiRes.status);
            console.log('📦 API Data:', JSON.stringify(apiRes.data, null, 2).substring(0, 500) + '...'); // Truncate

            if (apiRes.data.success) {
                if (apiRes.data.routePath && apiRes.data.routePath.length > 0) {
                    console.log(`   🎉 Success! Returned ${apiRes.data.stops.length} stops.`);
                    console.log(`   🛣️  Route Path contains ${apiRes.data.routePath.length} points.`);
                } else {
                    console.log(`   ⚠️ Returns stops (${apiRes.data.stops.length}) but NO Route Path (Straight lines will be used).`);
                }
            } else {
                console.log('   ⚠️ API returned success=false');
            }

        } catch (apiErr) {
            console.error('❌ API Call Failed:', apiErr.message);
            if (apiErr.response) console.error('   Data:', apiErr.response.data);
        }

        await pool.end();
    } catch (error) {
        console.error('❌ DB Error:', error.message);
    }
}

debugDriverData();
