const { pool } = require('./server/config/db');

async function check() {
    try {
        const res = await pool.query(`
      SELECT stop_name, stop_order, latitude, longitude 
      FROM route_stops 
      WHERE route_name = 'pudur' 
      ORDER BY stop_order ASC
    `);

        console.log('--- Route Stops for PUDUR ---');
        console.table(res.rows);

        // Check sequence
        let prevOrder = 0;
        let sequenceError = false;
        res.rows.forEach(r => {
            if (r.stop_order <= prevOrder) {
                console.error(`❌ Sequence Error: Stop ${r.stop_name} (Order ${r.stop_order}) comes after Order ${prevOrder}`);
                sequenceError = true;
            }
            prevOrder = r.stop_order;
        });

        if (!sequenceError) console.log('✅ Stop Order Sequence is Valid');

    } catch (err) {
        console.error('Query Failed:', err);
    } finally {
        process.exit();
    }
}

check();
