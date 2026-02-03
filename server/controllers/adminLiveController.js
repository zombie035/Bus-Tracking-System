// server/controllers/adminLiveController.js
const { pool } = require('../config/db');

// Send instant message to driver
exports.sendMessageToDriver = async (req, res) => {
    try {
        const { driverId, message, priority = 'info' } = req.body;
        const adminId = req.session.userId;

        if (!driverId || !message) {
            return res.status(400).json({ success: false, message: 'Driver ID and message are required' });
        }

        // Create notification
        const result = await pool.query(
            `INSERT INTO notifications 
       (recipient_type, recipient_id, sender_id, title, message, notification_type, created_at)
       VALUES ('user', $1, $2, 'Message from Admin', $3, $4, NOW())
       RETURNING *`,
            [driverId, adminId, message, priority]
        );

        const notification = result.rows[0];

        // Push via WebSocket
        if (global.notificationService) {
            global.notificationService.pushToUser(driverId, notification);
        }

        res.json({ success: true, message: 'Message sent to driver', notification });
    } catch (error) {
        console.error('Error sending message to driver:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

// Update trip status (Mark as Delayed/Cancelled)
exports.updateTripStatus = async (req, res) => {
    try {
        const { busId, status, reason, message } = req.body;
        // status: 'delayed', 'cancelled', 'running'

        if (!busId || !status) {
            return res.status(400).json({ success: false, message: 'Bus ID and status are required' });
        }

        // Update bus status
        const result = await pool.query(
            `UPDATE buses 
       SET 
         trip_status = $1,
         delay_status = $2,
         delay_reason = $3,
         updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
            [status, status === 'delayed', reason || null, busId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Bus not found' });
        }

        const bus = result.rows[0];

        // Broadcast update
        const io = req.app.get('io');
        if (io) {
            io.emit('bus-live-update', {
                busId,
                ...bus,
                timestamp: new Date()
            });
        }

        // Setup delay notification if needed
        if (status === 'delayed' && global.notificationService) {
            // Here we could broadcast to students on this route
        }

        res.json({ success: true, message: `Trip marked as ${status}`, bus });
    } catch (error) {
        console.error('Error updating trip status:', error);
        res.status(500).json({ success: false, message: 'Failed to update trip status' });
    }
};

// Reassign Bus/Route
exports.reassignBus = async (req, res) => {
    try {
        const { busId, driverId, routeName } = req.body;

        if (!busId) {
            return res.status(400).json({ success: false, message: 'Bus ID is required' });
        }

        let query = 'UPDATE buses SET updated_at = NOW()';
        const params = [];
        let paramIndex = 1;

        if (driverId) {
            query += `, driver_id = $${paramIndex++}`;
            params.push(driverId);
        }
        if (routeName) {
            query += `, route_name = $${paramIndex++}`;
            params.push(routeName);
        }

        query += ` WHERE id = $${paramIndex}`;
        params.push(busId);

        const result = await pool.query(query + ' RETURNING *', params);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Bus not found' });
        }

        const bus = result.rows[0];

        // Broadcast update
        const io = req.app.get('io');
        if (io) {
            io.emit('bus-live-update', {
                busId,
                ...bus,
                timestamp: new Date()
            });
        }

        res.json({ success: true, message: 'Bus reassigned successfully', bus });
    } catch (error) {
        console.error('Error reassigning bus:', error);
        res.status(500).json({ success: false, message: 'Failed to reassign bus' });
    }
};
