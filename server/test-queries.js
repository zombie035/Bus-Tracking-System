const { pool } = require('./config/db');

async function testQueries() {
    try {
        console.log('Testing Announcements Query...');
        // Simulated query from getAnnouncements
        await pool.query(`
        SELECT id, title, message, type, priority, route_name, created_at, expires_at
        FROM announcements
        LIMIT 1
    `);
        console.log('✅ Announcements Query Passed');

        console.log('Testing Users Query...');
        // Simulated query from getMyProfile / getDailySchedule
        await pool.query(`
        SELECT id, boarding_stop, dropping_stop, boarding_stop_time, dropping_stop_time
        FROM users
        LIMIT 1
    `);
        console.log('✅ Users Query Passed');

        process.exit(0);
    } catch (err) {
        console.error('❌ Query Failed:', err.message);
        process.exit(1);
    }
}

testQueries();
