const { pool } = require('./config/db');

async function testAnalytics() {
    try {
        console.log('Testing route analytics query...');

        const routeStatsQuery = `
      SELECT 
        r.id,
        r.route_name,
        r.route_number,
        r.starting_point,
        r.destination_point,
        r.stops,
        COUNT(DISTINCT b.id) as bus_count,
        COUNT(DISTINCT u.id) as student_count
      FROM routes r
      LEFT JOIN buses b ON b.route_id = r.id
      LEFT JOIN users u ON u.bus_assigned = b.id AND u.role = 'student'
      GROUP BY r.id, r.route_name, r.route_number, r.starting_point, r.destination_point, r.stops
      ORDER BY student_count DESC
    `;

        const result = await pool.query(routeStatsQuery);
        console.log('✅ Query successful!');
        console.log('Rows:', result.rows.length);
        console.log('Data:', JSON.stringify(result.rows, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testAnalytics();
