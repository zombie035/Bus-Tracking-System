const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkSchema() {
    console.log('🔍 Checking routes table schema...');
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'routes'
        `);

        console.log('✅ Routes Table Columns:');
        res.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });

        // Check content of 'pudur' in routes table
        console.log('\n🔍 Checking "pudur" entry in routes table...');
        const routeRes = await pool.query(`
            SELECT * FROM routes WHERE route_name = 'pudur' OR route_name = 'Pudur'
        `);

        if (routeRes.rows.length === 0) {
            console.log('❌ "pudur" not found in routes table either.');
        } else {
            console.log('✅ Found "pudur" in routes table:', JSON.stringify(routeRes.rows[0], null, 2));
        }

        await pool.end();
    } catch (error) {
        console.error('❌ DB Error:', error.message);
    }
}

checkSchema();
