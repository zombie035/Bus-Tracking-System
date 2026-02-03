// server/fixGmailStudent.js
const { pool } = require('./config/db');

async function fixGmailStudent() {
    try {
        // Check the gmail user
        const userResult = await pool.query(
            `SELECT u.id, u.name, u.email, u.bus_assigned, b.bus_number, b.route_name 
             FROM users u 
             LEFT JOIN buses b ON u.bus_assigned = b.id 
             WHERE u.email = $1`,
            ['sample@gmail.com']
        );

        console.log('\n========================================');
        console.log('User: sample@gmail.com');
        console.log('========================================');

        if (userResult.rows.length === 0) {
            console.log('❌ User sample@gmail.com NOT FOUND in database!');
            console.log('💡 You need to create this user via Admin Dashboard first.');
            process.exit(1);
        }

        console.log('User data:', userResult.rows[0]);

        const user = userResult.rows[0];

        // If bus_assigned is null or bus doesn't exist
        if (!user.bus_assigned || !user.bus_number) {
            console.log('\n⚠️ User has no valid bus assignment!');

            // Get first available bus
            const busResult = await pool.query('SELECT id, bus_number, route_name FROM buses ORDER BY id LIMIT 1');

            if (busResult.rows.length === 0) {
                console.log('❌ No buses available! Create a bus first.');
                process.exit(1);
            }

            const bus = busResult.rows[0];
            console.log(`\n✅ Assigning to bus: ID ${bus.id}, #${bus.bus_number} (${bus.route_name})`);

            await pool.query(
                'UPDATE users SET bus_assigned = $1 WHERE email = $2',
                [bus.id, 'sample@gmail.com']
            );

            console.log('✅ Updated successfully!');
        } else {
            console.log('✅ User already has valid bus assignment');
        }

        // Verify final state
        const finalResult = await pool.query(
            `SELECT u.id, u.name, u.email, u.bus_assigned, b.bus_number, b.route_name 
             FROM users u 
             LEFT JOIN buses b ON u.bus_assigned = b.id 
             WHERE u.email = $1`,
            ['sample@gmail.com']
        );

        console.log('\n========================================');
        console.log('Final State:');
        console.log('========================================');
        console.log(finalResult.rows[0]);
        console.log('\n💡 Hard refresh dashboard: Ctrl + Shift + R');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

fixGmailStudent();
