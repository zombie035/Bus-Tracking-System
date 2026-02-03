// server/models/Trip.js
const { pool } = require('../config/db');

class Trip {
    // Create new trip
    static async create(tripData) {
        try {
            const {
                busId,
                driverId,
                routeName,
                tripStatus = 'on_route'
            } = tripData;

            const query = `
        INSERT INTO trips (
          bus_id, driver_id, route_name, trip_status, trip_start_time
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING 
          id,
          bus_id as "busId",
          driver_id as "driverId",
          trip_status as "tripStatus",
          trip_start_time as "tripStartTime",
          route_name as "routeName"
      `;

            const values = [busId, driverId, routeName, tripStatus];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating trip:', error);
            throw error;
        }
    }

    // Find trips by bus ID
    static async findByBusId(busId, limit = 10) {
        try {
            const query = `
        SELECT 
          id,
          bus_id as "busId",
          driver_id as "driverId",
          trip_status as "tripStatus",
          trip_start_time as "tripStartTime",
          trip_end_time as "tripEndTime",
          route_name as "routeName",
          total_distance as "totalDistance",
          average_speed as "averageSpeed",
          created_at as "createdAt"
        FROM trips
        WHERE bus_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

            const result = await pool.query(query, [busId, limit]);
            return result.rows;
        } catch (error) {
            console.error('Error finding trips by bus:', error);
            throw error;
        }
    }

    // Find trips by driver ID
    static async findByDriverId(driverId, limit = 10) {
        try {
            const query = `
        SELECT 
          id,
          bus_id as "busId",
          driver_id as "driverId",
          trip_status as "tripStatus",
          trip_start_time as "tripStartTime",
          trip_end_time as "tripEndTime",
          route_name as "routeName",
          total_distance as "totalDistance",
          average_speed as "averageSpeed",
          created_at as "createdAt"
        FROM trips
        WHERE driver_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

            const result = await pool.query(query, [driverId, limit]);
            return result.rows;
        } catch (error) {
            console.error('Error finding trips by driver:', error);
            throw error;
        }
    }

    // Get current active trip for a bus
    static async getCurrentTrip(busId) {
        try {
            const query = `
        SELECT 
          id,
          bus_id as "busId",
          driver_id as "driverId",
          trip_status as "tripStatus",
          trip_start_time as "tripStartTime",
          route_name as "routeName"
        FROM trips
        WHERE bus_id = $1 AND trip_status = 'on_route'
        ORDER BY trip_start_time DESC
        LIMIT 1
      `;

            const result = await pool.query(query, [busId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error getting current trip:', error);
            throw error;
        }
    }

    // Update trip status
    static async updateStatus(tripId, status) {
        try {
            const query = `
        UPDATE trips 
        SET trip_status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING 
          id,
          trip_status as "tripStatus",
          updated_at as "updatedAt"
      `;

            const result = await pool.query(query, [status, tripId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating trip status:', error);
            throw error;
        }
    }

    // End trip with statistics
    static async endTrip(tripId, endData = {}) {
        try {
            const {
                totalDistance = 0,
                averageSpeed = 0
            } = endData;

            const query = `
        UPDATE trips 
        SET 
          trip_status = 'completed',
          trip_end_time = NOW(),
          total_distance = $1,
          average_speed = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING 
          id,
          trip_status as "tripStatus",
          trip_start_time as "tripStartTime",
          trip_end_time as "tripEndTime",
          total_distance as "totalDistance",
          average_speed as "averageSpeed"
      `;

            const values = [totalDistance, averageSpeed, tripId];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error ending trip:', error);
            throw error;
        }
    }

    // Get trip statistics for a driver
    static async getDriverStats(driverId, days = 30) {
        try {
            const query = `
        SELECT 
          COUNT(*) as "totalTrips",
          AVG(total_distance) as "avgDistance",
          AVG(average_speed) as "avgSpeed",
          SUM(total_distance) as "totalDistance"
        FROM trips
        WHERE driver_id = $1 
          AND trip_status = 'completed'
          AND created_at > NOW() - INTERVAL '${days} days'
      `;

            const result = await pool.query(query, [driverId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting driver stats:', error);
            throw error;
        }
    }

    // Find trip by ID
    static async findById(tripId) {
        try {
            const query = `
        SELECT 
          id,
          bus_id as "busId",
          driver_id as "driverId",
          trip_status as "tripStatus",
          trip_start_time as "tripStartTime",
          trip_end_time as "tripEndTime",
          route_name as "routeName",
          total_distance as "totalDistance",
          average_speed as "averageSpeed",
          created_at as "createdAt"
        FROM trips
        WHERE id = $1
      `;

            const result = await pool.query(query, [tripId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding trip by ID:', error);
            throw error;
        }
    }
}

module.exports = Trip;
