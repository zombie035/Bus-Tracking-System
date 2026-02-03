// server/models/EmergencyAlert.js
const { pool } = require('../config/db');

class EmergencyAlert {
    // Create new emergency alert
    static async create(alertData) {
        try {
            const {
                driverId,
                busId,
                alertType,
                message,
                latitude,
                longitude
            } = alertData;

            const query = `
        INSERT INTO emergency_alerts (
          driver_id, bus_id, alert_type, message, latitude, longitude
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id,
          driver_id as "driverId",
          bus_id as "busId",
          alert_type as "alertType",
          message,
          latitude,
          longitude,
          status,
          created_at as "createdAt"
      `;

            const values = [driverId, busId, alertType, message, latitude, longitude];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating emergency alert:', error);
            throw error;
        }
    }

    // Find all active alerts
    static async findActive() {
        try {
            const query = `
        SELECT 
          ea.id,
          ea.driver_id as "driverId",
          ea.bus_id as "busId",
          ea.alert_type as "alertType",
          ea.message,
          ea.latitude,
          ea.longitude,
          ea.status,
          ea.created_at as "createdAt",
          u.name as "driverName",
          u.phone as "driverPhone",
          b.bus_number as "busNumber",
          b.route_name as "routeName"
        FROM emergency_alerts ea
        LEFT JOIN users u ON ea.driver_id = u.id
        LEFT JOIN buses b ON ea.bus_id = b.id
        WHERE ea.status = 'active'
        ORDER BY ea.created_at DESC
      `;

            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error finding active alerts:', error);
            throw error;
        }
    }

    // Find all alerts (with optional status filter)
    static async findAll(status = null, limit = 100) {
        try {
            let query = `
        SELECT 
          ea.id,
          ea.driver_id as "driverId",
          ea.bus_id as "busId",
          ea.alert_type as "alertType",
          ea.message,
          ea.latitude,
          ea.longitude,
          ea.status,
          ea.created_at as "createdAt",
          ea.resolved_at as "resolvedAt",
          ea.resolved_by as "resolvedBy",
          u.name as "driverName",
          u.phone as "driverPhone",
          b.bus_number as "busNumber",
          b.route_name as "routeName"
        FROM emergency_alerts ea
        LEFT JOIN users u ON ea.driver_id = u.id
        LEFT JOIN buses b ON ea.bus_id = b.id
      `;

            const values = [];
            if (status) {
                query += ` WHERE ea.status = $1`;
                values.push(status);
            }

            query += ` ORDER BY ea.created_at DESC LIMIT ${limit}`;

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error finding alerts:', error);
            throw error;
        }
    }

    // Find alerts by driver
    static async findByDriver(driverId, limit = 50) {
        try {
            const query = `
        SELECT 
          id,
          driver_id as "driverId",
          bus_id as "busId",
          alert_type as "alertType",
          message,
          latitude,
          longitude,
          status,
          created_at as "createdAt",
          resolved_at as "resolvedAt"
        FROM emergency_alerts
        WHERE driver_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

            const result = await pool.query(query, [driverId, limit]);
            return result.rows;
        } catch (error) {
            console.error('Error finding alerts by driver:', error);
            throw error;
        }
    }

    // Resolve alert
    static async resolve(alertId, resolvedBy) {
        try {
            const query = `
        UPDATE emergency_alerts 
        SET 
          status = 'resolved',
          resolved_at = NOW(),
          resolved_by = $1
        WHERE id = $2
        RETURNING 
          id,
          status,
          resolved_at as "resolvedAt",
          resolved_by as "resolvedBy"
      `;

            const result = await pool.query(query, [resolvedBy, alertId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error resolving alert:', error);
            throw error;
        }
    }

    // Mark as false alarm
    static async markFalseAlarm(alertId, resolvedBy) {
        try {
            const query = `
        UPDATE emergency_alerts 
        SET 
          status = 'false_alarm',
          resolved_at = NOW(),
          resolved_by = $1
        WHERE id = $2
        RETURNING 
          id,
          status,
          resolved_at as "resolvedAt",
          resolved_by as "resolvedBy"
      `;

            const result = await pool.query(query, [resolvedBy, alertId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error marking false alarm:', error);
            throw error;
        }
    }

    // Get alert statistics
    static async getStats(days = 30) {
        try {
            const query = `
        SELECT 
          COUNT(*) as "totalAlerts",
          COUNT(CASE WHEN status = 'active' THEN 1 END) as "activeAlerts",
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as "resolvedAlerts",
          COUNT(CASE WHEN alert_type = 'breakdown' THEN 1 END) as "breakdownAlerts",
          COUNT(CASE WHEN alert_type = 'accident' THEN 1 END) as "accidentAlerts",
          COUNT(CASE WHEN alert_type = 'medical' THEN 1 END) as "medicalAlerts"
        FROM emergency_alerts
        WHERE created_at > NOW() - INTERVAL '${days} days'
      `;

            const result = await pool.query(query);
            return result.rows[0];
        } catch (error) {
            console.error('Error getting alert stats:', error);
            throw error;
        }
    }

    // Find alert by ID
    static async findById(alertId) {
        try {
            const query = `
        SELECT 
          ea.id,
          ea.driver_id as "driverId",
          ea.bus_id as "busId",
          ea.alert_type as "alertType",
          ea.message,
          ea.latitude,
          ea.longitude,
          ea.status,
          ea.created_at as "createdAt",
          ea.resolved_at as "resolvedAt",
          ea.resolved_by as "resolvedBy",
          u.name as "driverName",
          u.phone as "driverPhone",
          b.bus_number as "busNumber",
          b.route_name as "routeName"
        FROM emergency_alerts ea
        LEFT JOIN users u ON ea.driver_id = u.id
        LEFT JOIN buses b ON ea.bus_id = b.id
        WHERE ea.id = $1
      `;

            const result = await pool.query(query, [alertId]);
            return result.rows[0] || null;
        } catch (error) {
            console.error('Error finding alert by ID:', error);
            throw error;
        }
    }
}

module.exports = EmergencyAlert;
