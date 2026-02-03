// ==============================================================================
// STUDENT DASHBOARD ENHANCEMENT - NEW CONTROLLER METHODS
// Added for comprehensive student dashboard features
// ==============================================================================

// Get enhanced bus status with trip information
exports.getBusStatus = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const User = require('../models/User');
        const Bus = require('../models/Bus');

        const user = await User.findById(req.session.userId);
        if (!user || !user.bus_assigned) {
            return res.json({
                success: true,
                status: null,
                message: 'No bus assigned'
            });
        }

        const buses = await Bus.findWithDrivers();
        const myBus = buses.find(b => b.id === user.bus_assigned);

        if (!myBus) {
            return res.json({
                success: true,
                status: null,
                message: 'Bus not found'
            });
        }

        // Get additional status info from enhanced columns
        const result = await pool.query(
            `SELECT trip_status, is_delayed, delay_minutes, delay_reason,
              current_trip_started_at, next_stop_name, last_update_time
       FROM buses WHERE id = $1`,
            [myBus.id]
        );

        const busStatus = result.rows[0] || {};

        res.json({
            success: true,
            status: {
                tripStatus: busStatus.trip_status || 'idle',
                isDelayed: busStatus.is_delayed || false,
                delayMinutes: busStatus.delay_minutes || 0,
                delayReason: busStatus.delay_reason || null,
                tripStartedAt: busStatus.current_trip_started_at,
                nextStopName: busStatus.next_stop_name,
                lastUpdate: busStatus.last_update_time || myBus.updatedAt,
                currentLocation: {
                    latitude: myBus.latitude,
                    longitude: myBus.longitude
                }
            }
        });
    } catch (error) {
        console.error('Get bus status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Calculate ETA to student's specific boarding stop
exports.getETAToMyStop = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const User = require('../models/User');
        const Bus = require('../models/Bus');

        const user = await User.findById(req.session.userId);
        if (!user || !user.bus_assigned || !user.boarding_stop) {
            return res.json({
                success: true,
                eta: null,
                message: 'Incomplete assignment information'
            });
        }

        // Get bus location
        const buses = await Bus.findWithDrivers();
        const myBus = buses.find(b => b.id === user.bus_assigned);

        if (!myBus || !myBus.latitude || !myBus.longitude) {
            return res.json({
                success: true,
                eta: null,
                message: 'Bus location not available'
            });
        }

        // Get student's boarding stop coordinates
        const stopResult = await pool.query(
            `SELECT latitude, longitude, stop_order, pickup_time
       FROM route_stops
       WHERE route_name = $1 AND stop_name = $2`,
            [myBus.routeName, user.boarding_stop]
        );

        if (stopResult.rows.length === 0) {
            return res.json({
                success: true,
                eta: null,
                message: 'Stop information not found'
            });
        }

        const stopData = stopResult.rows[0];

        // Calculate distance using Haversine formula
        const R = 6371; // Earth radius in km
        const lat1 = parseFloat(myBus.latitude);
        const lon1 = parseFloat(myBus.longitude);
        const lat2 = parseFloat(stopData.latitude);
        const lon2 = parseFloat(stopData.longitude);

        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Get delay info
        const statusResult = await pool.query(
            'SELECT is_delayed, delay_minutes FROM buses WHERE id = $1',
            [myBus.id]
        );
        const delayMinutes = statusResult.rows[0]?.delay_minutes || 0;

        // Estimate ETA (assuming 30 km/h average speed in city)
        const baseETA = Math.round((distance / 30) * 60); // minutes
        const adjustedETA = baseETA + delayMinutes;

        res.json({
            success: true,
            eta: {
                minutes: adjustedETA > 0 ? adjustedETA : 0,
                distance: parseFloat(distance.toFixed(2)),
                scheduledTime: stopData.pickup_time,
                isDelayed: statusResult.rows[0]?.is_delayed || false,
                delayMinutes: delayMinutes
            }
        });
    } catch (error) {
        console.error('Get ETA error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get real-time distance to bus
exports.getDistanceToBus = async (req, res) => {
    try {
        const { studentLat, studentLng } = req.query;
        const User = require('../models/User');
        const Bus = require('../models/Bus');

        if (!studentLat || !studentLng) {
            return res.status(400).json({
                success: false,
                message: 'Student location required'
            });
        }

        const user = await User.findById(req.session.userId);
        if (!user || !user.bus_assigned) {
            return res.json({
                success: true,
                distance: null,
                message: 'No bus assigned'
            });
        }

        const buses = await Bus.findWithDrivers();
        const myBus = buses.find(b => b.id === user.bus_assigned);

        if (!myBus || !myBus.latitude || !myBus.longitude) {
            return res.json({
                success: true,
                distance: null,
                message: 'Bus location not available'
            });
        }

        // Calculate distance
        const R = 6371;
        const lat1 = parseFloat(studentLat);
        const lon1 = parseFloat(studentLng);
        const lat2 = parseFloat(myBus.latitude);
        const lon2 = parseFloat(myBus.longitude);

        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        res.json({
            success: true,
            distance: {
                kilometers: parseFloat(distance.toFixed(2)),
                meters: Math.round(distance * 1000)
            },
            busLocation: {
                latitude: myBus.latitude,
                longitude: myBus.longitude
            }
        });
    } catch (error) {
        console.error('Get distance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get bus's next stop
exports.getNextStop = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const User = require('../models/User');
        const Bus = require('../models/Bus');

        const user = await User.findById(req.session.userId);
        if (!user || !user.bus_assigned) {
            return res.json({
                success: true,
                nextStop: null,
                message: 'No bus assigned'
            });
        }

        const buses = await Bus.findWithDrivers();
        const myBus = buses.find(b => b.id === user.bus_assigned);

        if (!myBus) {
            return res.json({
                success: true,
                nextStop: null,
                message: 'Bus not found'
            });
        }

        // Get next stop from bus table
        const result = await pool.query(
            'SELECT next_stop_name, next_stop_id FROM buses WHERE id = $1',
            [myBus.id]
        );

        const nextStopName = result.rows[0]?.next_stop_name;

        if (!nextStopName) {
            return res.json({
                success: true,
                nextStop: null,
                message: 'Next stop not set'
            });
        }

        // Get full stop details
        const stopResult = await pool.query(
            `SELECT stop_name, latitude, longitude, stop_order, pickup_time
       FROM route_stops
       WHERE route_name = $1 AND stop_name = $2`,
            [myBus.routeName, nextStopName]
        );

        if (stopResult.rows.length === 0) {
            return res.json({
                success: true,
                nextStop: { name: nextStopName },
                message: 'Stop details not found'
            });
        }

        const stopData = stopResult.rows[0];

        // Calculate ETA to next stop if bus location available
        let etaToStop = null;
        if (myBus.latitude && myBus.longitude && stopData.latitude && stopData.longitude) {
            const R = 6371;
            const lat1 = parseFloat(myBus.latitude);
            const lon1 = parseFloat(myBus.longitude);
            const lat2 = parseFloat(stopData.latitude);
            const lon2 = parseFloat(stopData.longitude);

            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            etaToStop = Math.round((distance / 30) * 60); // minutes
        }

        res.json({
            success: true,
            nextStop: {
                name: stopData.stop_name,
                latitude: parseFloat(stopData.latitude),
                longitude: parseFloat(stopData.longitude),
                order: stopData.stop_order,
                scheduledTime: stopData.pickup_time,
                eta: etaToStop
            }
        });
    } catch (error) {
        console.error('Get next stop error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get student's stop details
exports.getMyStopDetails = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const User = require('../models/User');
        const Bus = require('../models/Bus');

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const buses = await Bus.findWithDrivers();
        const myBus = buses.find(b => b.id === user.bus_assigned);

        if (!myBus) {
            return res.json({
                success: true,
                stops: null,
                message: 'No bus assigned'
            });
        }

        // Get boarding stop details
        let boardingStop = null;
        if (user.boarding_stop) {
            const boardingResult = await pool.query(
                `SELECT stop_name, latitude, longitude, stop_order, pickup_time
         FROM route_stops
         WHERE route_name = $1 AND stop_name = $2`,
                [myBus.routeName, user.boarding_stop]
            );

            if (boardingResult.rows.length > 0) {
                const stop = boardingResult.rows[0];
                boardingStop = {
                    name: stop.stop_name,
                    latitude: parseFloat(stop.latitude),
                    longitude: parseFloat(stop.longitude),
                    order: stop.stop_order,
                    scheduledTime: stop.pickup_time,
                    type: 'boarding'
                };
            }
        }

        // Get dropping stop details
        let droppingStop = null;
        if (user.dropping_stop) {
            const droppingResult = await pool.query(
                `SELECT stop_name, latitude, longitude, stop_order, drop_time
         FROM route_stops
         WHERE route_name = $1 AND stop_name = $2`,
                [myBus.routeName, user.dropping_stop]
            );

            if (droppingResult.rows.length > 0) {
                const stop = droppingResult.rows[0];
                droppingStop = {
                    name: stop.stop_name,
                    latitude: parseFloat(stop.latitude),
                    longitude: parseFloat(stop.longitude),
                    order: stop.stop_order,
                    scheduledTime: stop.drop_time,
                    type: 'dropping'
                };
            }
        }

        res.json({
            success: true,
            stops: {
                boarding: boardingStop,
                dropping: droppingStop
            }
        });
    } catch (error) {
        console.error('Get stop details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get daily schedule (pickup & drop times)
exports.getDailySchedule = async (req, res) => {
    try {
        const User = require('../models/User');

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            schedule: {
                morningPickup: user.boarding_stop_time || null,
                eveningDrop: user.dropping_stop_time || null,
                boardingStop: user.boarding_stop || null,
                droppingStop: user.dropping_stop || null
            }
        });
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get student notifications (reuse Notification model from driver dashboard)
exports.getNotifications = async (req, res) => {
    try {
        const { pool } = require('../config/db');

        const result = await pool.query(
            `SELECT id, type, title, message, priority, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
            [req.session.userId]
        );

        res.json({
            success: true,
            notifications: result.rows.map(n => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                priority: n.priority,
                isRead: n.is_read,
                createdAt: n.created_at
            }))
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        // Return empty array instead of error to prevent UI breaking
        res.json({
            success: true,
            notifications: []
        });
    }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const { id } = req.params;

        await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
            [id, req.session.userId]
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get active announcements
exports.getAnnouncements = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const User = require('../models/User');
        const Bus = require('../models/Bus');

        const user = await User.findById(req.session.userId);

        // Add null check
        if (!user) {
            return res.json({
                success: true,
                announcements: []
            });
        }

        // Get user's route name
        let routeName = null;
        if (user.bus_assigned) {
            const buses = await Bus.findWithDrivers();
            const myBus = buses.find(b => b.id === user.bus_assigned);
            routeName = myBus?.routeName;
        }

        // Get announcements for all students or specific route
        const result = await pool.query(
            `SELECT id, title, message, type, priority, route_name, created_at, expires_at
       FROM announcements
       WHERE is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (target_audience IN ('all', 'students')
              OR (target_audience = 'specific_route' AND route_name = $1))
       ORDER BY priority DESC, created_at DESC
       LIMIT 20`,
            [routeName]
        );

        res.json({
            success: true,
            announcements: result.rows.map(a => ({
                id: a.id,
                title: a.title,
                message: a.message,
                type: a.type,
                priority: a.priority,
                routeName: a.route_name,
                createdAt: a.created_at,
                expiresAt: a.expires_at
            }))
        });
    } catch (error) {
        console.error('Get announcements error:', error);
        // Return empty array instead of error
        res.json({
            success: true,
            announcements: []
        });
    }
};

// Send quick contact message (predefined only)
exports.sendContactMessage = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const { messageId, recipientType } = req.body;
        const User = require('../models/User');
        const Bus = require('../models/Bus');

        if (!messageId || !recipientType) {
            return res.status(400).json({
                success: false,
                message: 'Message ID and recipient type required'
            });
        }

        // Verify message exists and is active
        const messageResult = await pool.query(
            `SELECT message_text, category FROM quick_contact_messages
       WHERE id = $1 AND is_active = true AND recipient = $2`,
            [messageId, recipientType]
        );

        if (messageResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invalid message selection'
            });
        }

        const messageText = messageResult.rows[0].message_text;

        // Get user's bus
        const user = await User.findById(req.session.userId);
        const buses = await Bus.findWithDrivers();
        const myBus = buses.find(b => b.id === user.bus_assigned);

        // Log the message
        await pool.query(
            `INSERT INTO student_messages (user_id, message_id, recipient_type, bus_id, status)
       VALUES ($1, $2, $3, $4, 'sent')`,
            [req.session.userId, messageId, recipientType, myBus?.id]
        );

        // Emit via WebSocket to recipient
        const io = req.app.get('io');
        if (io) {
            const eventName = recipientType === 'driver' ? 'student-message-driver' : 'student-message-admin';
            io.emit(eventName, {
                studentId: req.session.userId,
                studentName: user.name,
                busNumber: myBus?.busNumber,
                message: messageText,
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Message sent successfully'
        });
    } catch (error) {
        console.error('Send contact message error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get list of quick messages
exports.getQuickMessages = async (req, res) => {
    try {
        const { pool } = require('../config/db');

        const result = await pool.query(
            `SELECT id, category, message_text, recipient
       FROM quick_contact_messages
       WHERE is_active = true
       ORDER BY category, display_order`,
            []
        );

        const messages = result.rows.reduce((acc, msg) => {
            if (!acc[msg.category]) {
                acc[msg.category] = [];
            }
            acc[msg.category].push({
                id: msg.id,
                text: msg.message_text,
                recipient: msg.recipient
            });
            return acc;
        }, {});

        res.json({
            success: true,
            messages: messages
        });
    } catch (error) {
        console.error('Get quick messages error:', error);
        // Return empty object instead of error
        res.json({
            success: true,
            messages: {}
        });
    }
};

// Report issue/feedback
exports.reportIssue = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const { issueType, description, priority, latitude, longitude } = req.body;
        const User = require('../models/User');
        const Bus = require('../models/Bus');

        if (!issueType || !description) {
            return res.status(400).json({
                success: false,
                message: 'Issue type and description required'
            });
        }

        const validTypes = ['late_bus', 'wrong_stop', 'app_issue', 'driver_issue', 'safety_concern', 'other'];
        if (!validTypes.includes(issueType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid issue type'
            });
        }

        const user = await User.findById(req.session.userId);
        const buses = await Bus.findWithDrivers();
        const myBus = buses.find(b => b.id === user.bus_assigned);

        const result = await pool.query(
            `INSERT INTO student_feedback 
       (user_id, issue_type, description, priority, bus_id, location_lat, location_lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
            [
                req.session.userId,
                issueType,
                description,
                priority || 'medium',
                myBus?.id,
                latitude,
                longitude
            ]
        );

        // Notify admin via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.emit('student-feedback-submitted', {
                feedbackId: result.rows[0].id,
                studentId: req.session.userId,
                studentName: user.name,
                issueType: issueType,
                priority: priority || 'medium',
                timestamp: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            feedbackId: result.rows[0].id
        });
    } catch (error) {
        console.error('Report issue error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get feedback history
exports.getFeedbackHistory = async (req, res) => {
    try {
        const { pool } = require('../config/db');

        const result = await pool.query(
            `SELECT id, issue_type, description, priority, status, 
              created_at, resolved_at, admin_response
       FROM student_feedback
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
            [req.session.userId]
        );

        res.json({
            success: true,
            feedback: result.rows.map(f => ({
                id: f.id,
                issueType: f.issue_type,
                description: f.description,
                priority: f.priority,
                status: f.status,
                createdAt: f.created_at,
                resolvedAt: f.resolved_at,
                adminResponse: f.admin_response
            }))
        });
    } catch (error) {
        console.error('Get feedback history error:', error);
        // Return empty array instead of error
        res.json({
            success: true,
            feedback: []
        });
    }
};

// Get student settings/preferences
exports.getSettings = async (req, res) => {
    try {
        const { pool } = require('../config/db');

        const result = await pool.query(
            `SELECT theme, language, notifications_enabled, bus_started_alert,
              bus_delayed_alert, bus_approaching_alert, emergency_alert,
              announcement_alert, geofence_radius
       FROM student_settings
       WHERE user_id = $1`,
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            // Create default settings
            await pool.query(
                'INSERT INTO student_settings (user_id) VALUES ($1)',
                [req.session.userId]
            );

            return res.json({
                success: true,
                settings: {
                    theme: 'light',
                    language: 'en',
                    notificationsEnabled: true,
                    busStartedAlert: true,
                    busDelayedAlert: true,
                    busApproachingAlert: true,
                    emergencyAlert: true,
                    announcementAlert: true,
                    geofenceRadius: 500
                }
            });
        }

        const settings = result.rows[0];
        res.json({
            success: true,
            settings: {
                theme: settings.theme,
                language: settings.language,
                notificationsEnabled: settings.notifications_enabled,
                busStartedAlert: settings.bus_started_alert,
                busDelayedAlert: settings.bus_delayed_alert,
                busApproachingAlert: settings.bus_approaching_alert,
                emergencyAlert: settings.emergency_alert,
                announcementAlert: settings.announcement_alert,
                geofenceRadius: settings.geofence_radius
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update student settings
exports.updateSettings = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        const {
            theme,
            language,
            notificationsEnabled,
            busStartedAlert,
            busDelayedAlert,
            busApproachingAlert,
            emergencyAlert,
            announcementAlert,
            geofenceRadius
        } = req.body;

        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (theme !== undefined) {
            updates.push(`theme = $${paramCount++}`);
            values.push(theme);
        }
        if (language !== undefined) {
            updates.push(`language = $${paramCount++}`);
            values.push(language);
        }
        if (notificationsEnabled !== undefined) {
            updates.push(`notifications_enabled = $${paramCount++}`);
            values.push(notificationsEnabled);
        }
        if (busStartedAlert !== undefined) {
            updates.push(`bus_started_alert = $${paramCount++}`);
            values.push(busStartedAlert);
        }
        if (busDelayedAlert !== undefined) {
            updates.push(`bus_delayed_alert = $${paramCount++}`);
            values.push(busDelayedAlert);
        }
        if (busApproachingAlert !== undefined) {
            updates.push(`bus_approaching_alert = $${paramCount++}`);
            values.push(busApproachingAlert);
        }
        if (emergencyAlert !== undefined) {
            updates.push(`emergency_alert = $${paramCount++}`);
            values.push(emergencyAlert);
        }
        if (announcementAlert !== undefined) {
            updates.push(`announcement_alert = $${paramCount++}`);
            values.push(announcementAlert);
        }
        if (geofenceRadius !== undefined) {
            updates.push(`geofence_radius = $${paramCount++}`);
            values.push(geofenceRadius);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No settings to update'
            });
        }

        values.push(req.session.userId);

        await pool.query(
            `UPDATE student_settings
       SET ${updates.join(', ')}
       WHERE user_id = $${paramCount}`,
            values
        );

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
