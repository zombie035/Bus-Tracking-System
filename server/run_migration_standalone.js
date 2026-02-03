const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Hardcoded connection string from db.js
const connectionString = 'postgresql://app_user:strongpassword@localhost:5432/bus_tracking';

const pool = new Pool({
    connectionString: connectionString,
});

async function runMigration() {
    try {
        console.log('📖 Reading migration file...');
        const migrationPath = path.join(__dirname, 'migrations/005_live_tracking_updates.sql');
        if (!fs.existsSync(migrationPath)) {
            console.error(`File not found: ${migrationPath}`);
            // Try alternate path just in case
            const altPath = path.join(process.cwd(), 'server/migrations/005_live_tracking_updates.sql');
            console.log(`Trying alt path: ${altPath}`);
        }
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🔄 Executing migration...');
        await pool.query(sql);

        console.log('✅ Migration 005_live_tracking_updates.sql executed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
