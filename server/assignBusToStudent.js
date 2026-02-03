// Script to assign bus to sample@gmail.com student
require('dotenv').config();
const { pool } = require('./config/db');

async function assignBusToStudent() {
    try {
        console.log('📊 Checking users and buses...\n');

        // Get the student
        const studentResult = await pool.query(
            "SELECT id, email, name, bus_assigned FROM users WHERE email = $1",
            ['sample@gmail.com']
        );

        if (studentResult.rows.length === 0) {
            console.log('❌ Student not found with email: sample@gmail.com');
            process.exit(1);
        }

        const student = studentResult.rows[0];
        console.log('👤 Student found:');
        console.log(`   ID: ${student.id}`);
        console.log(`   Name: ${student.name}`);
        console.log(`   Current bus_assigned: ${student.bus_assigned || 'NULL'}\n`);

        // Get available buses
        const busesResult = await pool.query(
            "SELECT id, bus_number, route_name, driver_id FROM buses ORDER BY id"
        );

        if (busesResult.rows.length === 0) {
            console.log('❌ No buses found in database');
            process.exit(1);
        }

        console.log('🚌 Available buses:');
        busesResult.rows.forEach(bus => {
            console.log(`   [${bus.id}] Bus ${bus.bus_number} - ${bus.route_name}`);
        });

        // Assign first bus (or you can change the ID)
        const busToAssign = busesResult.rows[0];

        console.log(`\n🔧 Assigning Bus ${busToAssign.bus_number} (ID: ${busToAssign.id}) to student...\n`);

        await pool.query(
            "UPDATE users SET bus_assigned = $1 WHERE id = $2",
            [busToAssign.id, student.id]
        );

        console.log('✅ Bus assigned successfully!');
        console.log(`\nStudent ${student.name} is now assigned to:`);
        console.log(`   Bus: ${busToAssign.bus_number}`);
        console.log(`   Route: ${busToAssign.route_name}`);
        console.log(`\n✨ Refresh the student dashboard to see the assigned bus!\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

assignBusToStudent();
