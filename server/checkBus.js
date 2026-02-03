// server/checkBus.js
const { pool } = require('./config/db');

async function checkBus() {
    try {
        // First check the user
        const userResult = await pool.query(
            'SELECT id, name, email, bus_assigned FROM users WHERE email = $1',
            ['sample@college.edu']
        );

        console.log('\n========================================');
        console.log('1. User Data:');
        console.log('========================================');
        console.log(userResult.rows[0]);

        if (!userResult.rows[0]) {
            console.log('❌ User not found!');
            process.exit(1);
        }

        const busId = userResult.rows[0].bus_assigned;

        if (!busId) {
            console.log('\n⚠️ User has NO bus_assigned value in database!');
            console.log('💡 You need to assign a bus via Admin Dashboard > User Management');
            process.exit(0);
        }

        // Check if that bus exists
        console.log(`\n2. Looking for bus with ID ${busId}...`);
        const busResult = await pool.query(
            'SELECT * FROM buses WHERE id = $1',
            [busId]
        );

        console.log('========================================');
        console.log('Bus Data:');
        console.log('========================================');

        if (busResult.rows.length === 0) {
            console.log(`❌ BUS NOT FOUND! User is assigned to bus ID ${busId}, but that bus doesn't exist!`);
            console.log('\n💡 Solutions:');
            console.log('   1. Create a bus in Admin Dashboard > Bus Management');
            console.log('   2. Assign the student to an existing bus');
            console.log('\n   Let me show you available buses:');

            const allBuses = await pool.query('SELECT id, bus_number, route_name FROM buses ORDER BY id');
            console.log('\nAvailable buses:');
            console.log(allBuses.rows);
        } else {
            console.log('✅ Bus found:', busResult.rows[0]);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkBus();
