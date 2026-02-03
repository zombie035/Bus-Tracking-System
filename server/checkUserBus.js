// server/checkUserBus.js
const { pool } = require('./config/db');

async function checkUser() {
    try {
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.bus_assigned, b.bus_number, b.route_name 
             FROM users u 
             LEFT JOIN buses b ON u.bus_assigned = b.id 
             WHERE u.email = $1`,
            ['sample@college.edu']
        );

        console.log('\n========================================');
        console.log('User Data for sample@college.edu:');
        console.log('========================================');
        console.log(JSON.stringify(result.rows, null, 2));
        console.log('========================================\n');

        if (result.rows.length === 0) {
            console.log('❌ User not found!');
        } else if (!result.rows[0].bus_assigned) {
            console.log('⚠️ User exists but has NO BUS ASSIGNED in database!');
            console.log('💡 You need to assign a bus to this user via Admin Dashboard > User Management');
        } else {
            console.log('✅ User has bus assigned:', result.rows[0].bus_number);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkUser();
