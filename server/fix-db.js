const { pool } = require('./config/db');

async function fixDb() {
    try {
        console.log('Adding missing columns to buses table...');

        const queries = [
            "ALTER TABLE buses ADD COLUMN IF NOT EXISTS trip_status VARCHAR(50) DEFAULT 'idle';",
            "ALTER TABLE buses ADD COLUMN IF NOT EXISTS delay_reason TEXT;",
            "ALTER TABLE buses ADD COLUMN IF NOT EXISTS current_trip_started_at TIMESTAMP;",
            "ALTER TABLE buses ADD COLUMN IF NOT EXISTS next_stop_name VARCHAR(100);",
            "ALTER TABLE buses ADD COLUMN IF NOT EXISTS last_update_time TIMESTAMP;"
        ];

        for (const query of queries) {
            await pool.query(query);
            console.log(`Executed: ${query}`);
        }

        console.log('✅ Database schema updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating DB:', err);
        process.exit(1);
    }
}

fixDb();
