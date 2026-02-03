// server/utils/seedDatabase.js
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const seedDatabase = async () => {
  try {
    // Check if users already exist
    const userCheck = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userCheck.rows[0].count);
    
    if (userCount > 0) {
      console.log('✅ Database already has users, skipping seed');
      return;
    }

    console.log('🌱 Seeding database with sample data...');

    // Create sample buses
    const busData = [
      {
        busNumber: 'BUS-001',
        route: 'Route A',
        capacity: 50,
        status: 'active',
        latitude: 26.9124,
        longitude: 75.8572
      },
      {
        busNumber: 'BUS-002',
        route: 'Route B',
        capacity: 50,
        status: 'active',
        latitude: 26.9125,
        longitude: 75.8573
      },
      {
        busNumber: 'BUS-003',
        route: 'Route C',
        capacity: 50,
        status: 'inactive',
        latitude: 26.9123,
        longitude: 75.8571
      }
    ];

    const buses = [];
    for (const bus of busData) {
      const result = await pool.query(
        `INSERT INTO buses (bus_number, route, capacity, status, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [bus.busNumber, bus.route, bus.capacity, bus.status, bus.latitude, bus.longitude]
      );
      buses.push(result.rows[0]);
    }

    // Hash passwords
    const password = await bcrypt.hash('admin123', 10);
    const driverPassword = await bcrypt.hash('driver123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    // Create sample users
    const userData = [
      {
        name: 'Admin User',
        email: 'admin@college.edu',
        password: password,
        role: 'admin',
        phone: '9999999999'
      },
      {
        name: 'John Driver',
        email: 'driver@college.edu',
        password: driverPassword,
        role: 'driver',
        phone: '8888888888',
        busAssigned: buses[0].id
      },
      {
        name: 'Alice Student',
        email: 'student@college.edu',
        password: studentPassword,
        role: 'student',
        studentId: 'STU001',
        phone: '7777777777',
        busAssigned: buses[0].id
      },
      {
        name: 'Bob Student',
        email: 'bob@college.edu',
        password: studentPassword,
        role: 'student',
        studentId: 'STU002',
        phone: '7777777778',
        busAssigned: buses[1].id
      }
    ];

    const users = [];
    for (const user of userData) {
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, student_id, phone, bus_assigned)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [user.name, user.email, user.password, user.role, user.studentId || null, user.phone, user.busAssigned || null]
      );
      users.push(result.rows[0]);
    }

    console.log('✅ Database seeding complete!');
    console.log(`   📦 Created ${buses.length} buses`);
    console.log(`   👥 Created ${users.length} users`);
    console.log('\n📝 Test Credentials:');
    console.log('   Admin: admin@college.edu / admin123');
    console.log('   Driver: driver@college.edu / driver123');
    console.log('   Student: student@college.edu / student123');

  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

module.exports = seedDatabase;
