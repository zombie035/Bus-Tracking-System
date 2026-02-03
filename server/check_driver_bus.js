// Quick script to check driver and bus assignments
require('dotenv').config();
const { pool } = require('./config/db');

async function checkData() {
    try {
        console.log('\n📊 CHECKING DRIVERS:');
        const drivers = await pool.query('SELECT id, name, role, phone FROM users WHERE role = $1', ['driver']);
        console.table(drivers.rows);

        console.log('\n📊 CHECKING BUSES:');
        const buses = await pool.query('SELECT id, bus_number, route_name, driver_id, status FROM buses');
        console.table(buses.rows);

        console.log('\n📊 BUSES WITH DRIVERS (JOIN):');
        const busesWithDrivers = await pool.query(`
      SELECT 
        b.id, 
        b.bus_number, 
        b.route_name, 
        b.driver_id,
        u.name as driver_name,
        u.phone as driver_phone
      FROM buses b
      LEFT JOIN users u ON b.driver_id = u.id
    `);
        console.table(busesWithDrivers.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
