const { pool } = require('../config/db');

// Mock data logic (kept for fallback)
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';
let mockBuses = [];

class Bus {
  // 1. Find all buses (Standard find)
  static async find() {
    if (USE_MOCK_DB) return mockBuses;

    try {
      const query = `
        SELECT 
          id,
          bus_number as "busNumber",
          route_name as "routeName",
          capacity,
          current_passengers as "currentPassengers",
          status,
          driver_id as "driverId",
          latitude,
          longitude,
          updated_at as "updatedAt"
        FROM buses 
        ORDER BY bus_number
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error finding buses:', error);
      throw error;
    }
  }

  // 2. Find buses with Driver Info (CRITICAL: Used by Admin Dashboard)
  static async findWithDrivers() {
    console.log('   📊 Bus.findWithDrivers() called');
    console.log('   USE_MOCK_DB:', USE_MOCK_DB);

    if (USE_MOCK_DB) {
      console.log('   ⚠️ Using mock database');
      return mockBuses;
    }

    try {
      console.log('   🔍 Executing database query...');

      // Joins buses with users to get driver name
      const query = `
        SELECT 
          b.id,
          b.bus_number as "busNumber",
          b.route_name as "routeName",
          b.capacity,
          b.current_passengers as "currentPassengers",
          b.status,
          b.driver_id as "driverId",
          b.latitude,
          b.longitude,
          b.speed,
          b.engine_status as "engineStatus",
          b.direction,
          b.idle_start_time as "idleStartTime",
          b.updated_at as "updatedAt",
          u.name as "driverName",
          u.email as "driverEmail",
          u.phone as "driverPhone"
        FROM buses b
        LEFT JOIN users u ON b.driver_id = u.id
        ORDER BY b.updated_at DESC
      `;

      console.log('   Query:', query.substring(0, 100) + '...');
      const result = await pool.query(query);

      console.log('   ✅ Query executed successfully');
      console.log('   Rows returned:', result.rows.length);
      console.log('   Row count:', result.rowCount);
      console.log('   First row:', result.rows[0]);

      return result.rows;
    } catch (error) {
      console.error('   ❌ Error finding buses with drivers:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      throw error;
    }
  }

  // 3. Find bus by ID
  static async findById(id) {
    if (USE_MOCK_DB) return mockBuses.find(b => b.id === parseInt(id));

    try {
      const query = `
        SELECT 
          id,
          bus_number as "busNumber",
          route_name as "routeName",
          capacity,
          current_passengers as "currentPassengers",
          status,
          driver_id as "driverId",
          latitude,
          longitude,
          updated_at as "updatedAt"
        FROM buses 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding bus by ID:', error);
      throw error;
    }
  }

  // 4. Create new bus
  static async create(busData) {
    console.log('   📝 Bus.create() called with:', busData);
    console.log('   USE_MOCK_DB:', USE_MOCK_DB);

    if (USE_MOCK_DB) {
      console.log('   ⚠️ Using mock database');
      return {};
    }

    try {
      const {
        busNumber, routeName, driverId, capacity,
        latitude = 9.849607, longitude = 78.163951, status = 'active'
      } = busData;

      console.log('   Extracted values:', { busNumber, routeName, driverId, capacity, latitude, longitude, status });

      // Handle driverId being an empty string or 'null' string
      const validDriverId = (driverId && driverId !== 'unassigned') ? parseInt(driverId) : null;
      console.log('   Valid driver ID:', validDriverId);

      const insertQuery = `INSERT INTO buses 
          (bus_number, route_name, driver_id, capacity, latitude, longitude, status, current_passengers)
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7, 0)
         RETURNING 
          id,
          bus_number as "busNumber",
          route_name as "routeName",
          capacity,
          status,
          driver_id as "driverId"`;

      const values = [busNumber, routeName, validDriverId, capacity, latitude, longitude, status];
      console.log('   Insert values:', values);
      console.log('   Executing INSERT query...');

      const result = await pool.query(insertQuery, values);

      console.log('   ✅ INSERT executed successfully');
      console.log('   Rows inserted:', result.rowCount);
      console.log('   Returned row:', result.rows[0]);

      return result.rows[0];
    } catch (error) {
      console.error('   ❌ Error creating bus:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error detail:', error.detail);
      throw error;
    }
  }

  // 5. Update bus
  static async findByIdAndUpdate(id, updateData) {
    if (USE_MOCK_DB) return {};

    try {
      // Map Frontend keys to DB columns
      const mapping = {
        busNumber: 'bus_number',
        routeName: 'route_name',
        driverId: 'driver_id',
        capacity: 'capacity',
        status: 'status',
        latitude: 'latitude',
        longitude: 'longitude',
        speed: 'speed'
      };

      const fields = [];
      const values = [];
      let i = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (mapping[key] !== undefined) {
          fields.push(`${mapping[key]} = $${i}`);
          // Handle driverId null logic specifically
          if (key === 'driverId') {
            if (value === '' || value === 'unassigned' || value === null || value === undefined) {
              console.log(`   🔧 driverId: Setting to NULL (received: ${value})`);
              values.push(null);
            } else {
              const driverIdInt = parseInt(value);
              console.log(`   🔧 driverId: Converting "${value}" to integer ${driverIdInt}`);
              values.push(driverIdInt);
            }
          } else {
            values.push(value);
          }
          i++;
        }
      }

      if (fields.length === 0) {
        console.log('⚠️ No valid fields to update');
        return this.findById(id);
      }

      values.push(id);

      // Return complete bus data including driver info after update
      const query = `
        UPDATE buses 
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${i}
        RETURNING 
          id,
          bus_number as "busNumber",
          route_name as "routeName",
          capacity,
          current_passengers as "currentPassengers",
          status,
          driver_id as "driverId",
          latitude,
          longitude,
          speed,
          updated_at as "updatedAt"
      `;

      console.log('Update query:', query);
      console.log('Update values:', values);

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Bus with id ${id} not found`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error updating bus:', error);
      throw error;
    }
  }

  // 6. Delete bus
  static async findByIdAndDelete(id) {
    if (USE_MOCK_DB) return {};

    try {
      const result = await pool.query(
        'DELETE FROM buses WHERE id = $1 RETURNING id, bus_number as "busNumber"',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error(`Bus with id ${id} not found`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error deleting bus:', error);
      throw error;
    }
  }

  // 7. Update bus location
  static async updateLocation(id, latitude, longitude) {
    try {
      const result = await pool.query(
        `UPDATE buses 
         SET latitude = $1, longitude = $2, updated_at = NOW()
         WHERE id = $3 
         RETURNING id, latitude, longitude`,
        [latitude, longitude, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating bus location:', error);
      throw error;
    }
  }
}

module.exports = Bus;