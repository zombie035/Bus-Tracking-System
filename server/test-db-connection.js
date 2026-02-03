const { Pool } = require('pg');
require('dotenv').config();

const configs = [
    {
        name: 'From .env',
        connectionString: process.env.DATABASE_URL
    },
    {
        name: 'Hardcoded in db.js',
        connectionString: 'postgresql://app_user:strongpassword@localhost:5432/bus_tracking'
    },
    {
        name: 'Common Default',
        connectionString: 'postgresql://postgres:postgres@localhost:5432/bus_tracking_db' // Trying likely db name from .env
    }
];

async function testConnection(config) {
    if (!config.connectionString) {
        console.log(`❌ ${config.name}: No connection string provided`);
        return false;
    }

    console.log(`🔄 Testing ${config.name}: ${config.connectionString.replace(/:[^:@]+@/, ':****@')}`);

    const pool = new Pool({
        connectionString: config.connectionString,
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as now, current_database() as db');
        console.log(`✅ ${config.name}: Success! Connected to ${result.rows[0].db} at ${result.rows[0].now}`);
        client.release();
        await pool.end();
        return true;
    } catch (err) {
        console.log(`❌ ${config.name}: Failed - ${err.message}`);
        await pool.end();
        return false;
    }
}

async function runNot() {
    console.log('--- Starting Database Connection Tests ---');
    for (const config of configs) {
        await testConnection(config);
    }
    console.log('--- Tests Completed ---');
}

runNot();
