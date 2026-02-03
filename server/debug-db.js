const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkData() {
    console.log('🔍 Checking database...');
    try {
        const res = await pool.query('SELECT count(*) FROM route_stops');
        console.log('📦 Total Route Stops:', res.rows[0].count);

        const routes = await pool.query('SELECT DISTINCT route_name FROM route_stops');
        console.log('🛣️  Routes with stops:', routes.rows.map(r => r.route_name).join(', '));

        await pool.end();
    } catch (error) {
        console.error('❌ DB Error:', error.message);
    }
}

checkData();
