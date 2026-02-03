// server/fixStudentBus.js
const { pool } = require('./config/db');

async function fixStudentBus() {
    try {
        // Get available buses
        const busesResult = await pool.query('SELECT id, bus_number, route_name FROM buses ORDER BY id');

        console.log('\n========================================');
        console.log('Available Buses:');
        console.log('========================================');
        busesResult.rows.forEach(bus => {
            console.log(`  ID: ${bus.id} | Bus #: ${bus.bus_number} | Route: ${bus.route_name}`);
        });

        if (busesResult.rows.length === 0) {
            console.log('❌ No buses found! Please create a bus first via Admin Dashboard.');
            process.exit(1);
        }

        // Use the first available bus
        const firstBus = busesResult.rows[0];

        console.log(`\n========================================`);
        console.log(`Assigning student to Bus ID ${firstBus.id} (${firstBus.bus_number})`);
        console.log(`========================================`);

        // Update the student's bus assignment
        const updateResult = await pool.query(
            'UPDATE users SET bus_assigned = $1 WHERE email = $2 RETURNING id, name, email, bus_assigned',
            [firstBus.id, 'sample@college.edu']
        );

        console.log('\n✅ Successfully updated!');
        console.log('Updated user:', updateResult.rows[0]);

        // Verify the change
        const verifyResult = await pool.query(
            `SELECT u.id, u.name, u.email, u.bus_assigned, b.bus_number, b.route_name 
             FROM users u 
             LEFT JOIN buses b ON u.bus_assigned = b.id 
             WHERE u.email = $1`,
            ['sample@college.edu']
        );

        console.log('\n========================================');
        console.log('🎉 Final Result:');
        console.log('========================================');
        console.log(verifyResult.rows[0]);
        console.log('\n💡 Now hard refresh the student dashboard (Ctrl + Shift + R) to see the bus!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixStudentBus();
