const { pool } = require('./config/db');

async function fixDb() {
    try {
        console.log('Adding missing next_stop_id to buses table...');

        const queries = [
            "ALTER TABLE buses ADD COLUMN IF NOT EXISTS next_stop_id VARCHAR(50);"
            // using VARCHAR to be safe, could be INTEGER? 
            // Controller doesn't specify type usage, likely ID string or int.
            // If it joins with route_stops.id (int) -> INTEGER.
            // If it joins stops.stop_id (string?) -> VARCHAR.
            // Safest: VARCHAR unless known.
            // Route name is string. Stop name is string.
            // existing `bus_assigned` is INT.
            // `next_stop_id` implies ID.
            // I'll use INTEGER to align with typical IDs, or check usage?
            // Usage: `SELECT next_stop_name, next_stop_id`. Just returns it.
            // I'll use INTEGER assuming stops have ID.
        ];

        // Better: check route_stops.id type? 
        // `SELECT id FROM route_stops` -> ID is SERIAL (integer).
        // So next_stop_id should be INTEGER.

        const fixQuery = "ALTER TABLE buses ADD COLUMN IF NOT EXISTS next_stop_id INTEGER;";

        await pool.query(fixQuery);
        console.log(`Executed: ${fixQuery}`);

        console.log('✅ Database schema updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating DB:', err);
        process.exit(1);
    }
}

fixDb();
