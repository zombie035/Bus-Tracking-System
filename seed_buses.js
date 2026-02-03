const { pool } = require('./server/config/db');

async function seedBuses() {
  let client;
  try {
    console.log('🌱 Seeding buses into PostgreSQL database...');

    client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if buses already exist
    const existing = await client.query('SELECT COUNT(*) as count FROM buses');
    const count = parseInt(existing.rows[0].count);
    console.log(`📊 Existing buses: ${count}`);

    if (count > 0) {
      console.log('✅ Buses already exist in database');
      return;
    }

    // Insert sample buses
    const buses = [
      {
        bus_number: 'BUS-001',
        route_name: 'Downtown Route',
        capacity: 50,
        status: 'active',
        latitude: 40.7128,
        longitude: -74.0060,
        speed: 25.5
      },
      {
        bus_number: 'BUS-002',
        route_name: 'Airport Route',
        capacity: 45,
        status: 'active',
        latitude: 40.7589,
        longitude: -73.9851,
        speed: 30.0
      },
      {
        bus_number: 'BUS-003',
        route_name: 'Campus Route',
        capacity: 40,
        status: 'inactive',
        latitude: 40.7505,
        longitude: -73.9934,
        speed: 0.0
      }
    ];

    console.log('🚍 Inserting buses...');
    for (const bus of buses) {
      console.log(`  Inserting ${bus.bus_number}...`);
      const result = await client.query(
        `INSERT INTO buses
        (bus_number, route_name, capacity, status, latitude, longitude, speed, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        [bus.bus_number, bus.route_name, bus.capacity, bus.status, bus.latitude, bus.longitude, bus.speed]
      );
      console.log(`  ✅ Inserted ${bus.bus_number} with ID: ${result.rows[0].id}`);
    }

    console.log(`✅ Successfully seeded ${buses.length} buses into database`);

  } catch (error) {
    console.error('❌ Error seeding buses:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

seedBuses();
