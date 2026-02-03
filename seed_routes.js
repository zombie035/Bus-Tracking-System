const { pool } = require('./server/config/db');

async function seedRoutes() {
  let client;
  try {
    console.log('🌱 Seeding routes into PostgreSQL database...');

    client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if routes already exist
    const existing = await client.query('SELECT COUNT(*) as count FROM routes');
    const count = parseInt(existing.rows[0].count);
    console.log(`📊 Existing routes: ${count}`);

    if (count > 0) {
      console.log('✅ Routes already exist in database');
      return;
    }

    // Insert sample routes with stops
    const routes = [
      {
        route_name: 'Downtown Express',
        route_number: 'DT-001',
        starting_point: 'Central Station',
        destination_point: 'Downtown Plaza',
        stops: [
          { name: 'Central Station', arrivalTime: '08:00', departureTime: '08:05' },
          { name: 'Main Street', arrivalTime: '08:15', departureTime: '08:20' },
          { name: 'City Hall', arrivalTime: '08:30', departureTime: '08:35' },
          { name: 'Downtown Plaza', arrivalTime: '08:45', departureTime: '08:50' }
        ]
      },
      {
        route_name: 'Airport Shuttle',
        route_number: 'AP-002',
        starting_point: 'Terminal A',
        destination_point: 'Terminal C',
        stops: [
          { name: 'Terminal A', arrivalTime: '09:00', departureTime: '09:05' },
          { name: 'Terminal B', arrivalTime: '09:15', departureTime: '09:20' },
          { name: 'Terminal C', arrivalTime: '09:30', departureTime: '09:35' }
        ]
      },
      {
        route_name: 'Campus Loop',
        route_number: 'CL-003',
        starting_point: 'Main Campus',
        destination_point: 'Science Building',
        stops: [
          { name: 'Main Campus', arrivalTime: '07:00', departureTime: '07:05' },
          { name: 'Library', arrivalTime: '07:10', departureTime: '07:15' },
          { name: 'Cafeteria', arrivalTime: '07:20', departureTime: '07:25' },
          { name: 'Gym', arrivalTime: '07:30', departureTime: '07:35' },
          { name: 'Science Building', arrivalTime: '07:40', departureTime: '07:45' }
        ]
      }
    ];

    console.log('🚌 Inserting routes...');
    for (const route of routes) {
      console.log(`  Inserting ${route.route_name}...`);
      const result = await client.query(
        `INSERT INTO routes
        (route_name, route_number, starting_point, destination_point, stops, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id`,
        [route.route_name, route.route_number, route.starting_point, route.destination_point, JSON.stringify(route.stops)]
      );
      console.log(`  ✅ Inserted ${route.route_name} with ID: ${result.rows[0].id}`);
    }

    console.log(`✅ Successfully seeded ${routes.length} routes into database`);

  } catch (error) {
    console.error('❌ Error seeding routes:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

seedRoutes();
