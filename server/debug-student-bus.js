const { pool } = require('./config/db');
require('dotenv').config();

async function debugStudentData() {
    try {
        console.log('🔍 Debugging Student Bus Assignment...');

        // 1. List all users with role 'student'
        const usersRes = await pool.query(`
            SELECT id, name, email, role, bus_assigned 
            FROM users 
            WHERE role = 'student'
        `);

        console.log(`\n📚 Found ${usersRes.rows.length} students:`);
        usersRes.rows.forEach(u => {
            console.log(`   - ID: ${u.id} | Name: ${u.name} | Bus Assigned: "${u.bus_assigned}" (${typeof u.bus_assigned})`);
        });

        // 2. List all buses to cross-reference
        const busRes = await pool.query('SELECT id, bus_number, route_name FROM buses');
        console.log(`\n🚌 Found ${busRes.rows.length} buses:`);
        busRes.rows.forEach(b => {
            console.log(`   - ID: ${b.id} | Number: ${b.bus_number} | Route: ${b.route_name}`);
        });

        // 3. Check for mismatches using UPDATED LOGIC
        console.log('\n⚖️  Checking assignments with NEW LOGIC (ID or Number match):');
        usersRes.rows.forEach(u => {
            if (u.bus_assigned) {
                // Mimic studentController.js logic
                const myBus = busRes.rows.find(b => b.id == u.bus_assigned || b.bus_number == u.bus_assigned);

                if (myBus) {
                    console.log(`   ✅ Student ${u.name} (Assigned: "${u.bus_assigned}") MATCHED Bus ID ${myBus.id} (Route: ${myBus.route_name})`);
                } else {
                    console.log(`   ❌ Student ${u.name} (Assigned: "${u.bus_assigned}") FAILED TO MATCH any bus.`);
                }
            } else {
                console.log(`   ⚪ Student ${u.name} has NO bus assigned.`);
            }
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

debugStudentData();
