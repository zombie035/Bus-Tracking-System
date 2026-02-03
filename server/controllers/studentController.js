const Bus = require('../models/Bus');
const User = require('../models/User');
const routeCalculator = require('../utils/routeCalculator'); // Add this

exports.dashboard = async (req, res) => {
    try {
        // Populate the assigned bus and nested driver details
        const user = await User.findById(req.session.userId).populate({
            path: 'busAssigned',
            populate: { path: 'driverId', select: 'phone email name' } // Fetch driver phone
        });

        if (!user.busAssigned) {
            return res.render('student/dashboard', {
                bus: null,
                student: user, // Pass student data for the sidebar
                message: 'No bus assigned to you yet. Please contact the AIDS department.'
            });
        }

        res.render('student/dashboard', {
            bus: user.busAssigned,
            student: user // Ensure dynamic user info is passed
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading student dashboard");
    }
};



exports.getMyBusLocation = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        console.log('🔍 Student requesting bus location, userId:', req.session.userId);

        // Get user with bus_assigned field
        const userResult = await pool.query(
            'SELECT id, name, email, bus_assigned FROM users WHERE id = $1',
            [req.session.userId]
        );

        const user = userResult.rows[0];

        console.log('👤 User found:', {
            userId: user?.id,
            email: user?.email,
            busAssignedId: user?.bus_assigned,
            hasBusAssigned: !!user?.bus_assigned
        });

        if (!user || !user.bus_assigned) {
            console.warn('⚠️ No bus assigned to user:', req.session.userId);
            return res.status(404).json({
                error: 'No bus assigned'
            });
        }

        // Get the bus data (Try by ID or Bus Number)
        let busResult = await pool.query(
            'SELECT * FROM buses WHERE id::text = $1 OR bus_number = $1',
            [user.bus_assigned.toString()]
        );

        let bus = busResult.rows[0];

        // FALLBACK: If specific bus not found, find ANY bus to show something (Demo Mode)
        if (!bus) {
            console.log('⚠️ Specific bus not found. Using Fallback Bus (first available).');
            const fallbackResult = await pool.query('SELECT * FROM buses LIMIT 1');
            bus = fallbackResult.rows[0];
        }

        if (!bus) {
            console.warn('⚠️ Bus not found for ID:', user.bus_assigned);
            return res.status(404).json({
                error: 'Bus not found'
            });
        }

        console.log('🚌 Bus data retrieved:', {
            busId: bus.id,
            busNumber: bus.bus_number,
            latitude: bus.latitude,
            longitude: bus.longitude,
            hasCoordinates: !!(bus.latitude && bus.longitude)
        });

        res.json({
            _id: bus.id,
            busId: bus.bus_id,
            busNumber: bus.bus_number,
            routeName: bus.route_name,
            driverName: bus.driver_name,
            latitude: bus.latitude,
            longitude: bus.longitude,
            status: bus.status,
            updatedAt: bus.updated_at
        });
    } catch (error) {
        console.error('❌ Error in getMyBusLocation:', error);
        res.status(500).json({ error: error.message });
    }
};

// NEW: Get route information between student and bus
exports.getRouteInfo = async (req, res) => {
    try {
        const { studentLat, studentLng, busLat, busLng } = req.query;

        if (!studentLat || !studentLng || !busLat || !busLng) {
            return res.status(400).json({ error: 'Missing coordinates' });
        }

        const route = await routeCalculator.calculateRoute(
            { lat: parseFloat(studentLat), lng: parseFloat(studentLng) },
            { lat: parseFloat(busLat), lng: parseFloat(busLng) }
        );

        res.json(route);

    } catch (error) {
        console.error('Route info error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get route stops for student's assigned route
exports.getMyRouteStops = async (req, res) => {
    try {
        const { pool } = require('../config/db');

        console.log('🔍 getMyRouteStops called for user:', req.session.userId);

        // Get user's bus assignment
        const user = await User.findById(req.session.userId);
        if (!user) {
            console.log('❌ User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('👤 User found:', { id: user.id, bus_assigned: user.bus_assigned });

        // Get bus to find route name
        const buses = await Bus.findWithDrivers();
        console.log('🚌 Available buses:', buses.map(b => ({ id: b.id, busNumber: b.busNumber, routeName: b.routeName })));

        let myBus = buses.find(b => b.id == user.bus_assigned || b.bus_number == user.bus_assigned);

        // FALLBACK: If no bus assigned/found, default to first available bus or 'pudur' to ensure dashboard works
        if (!myBus) {
            console.log('⚠️ No specific bus found for user. Using Fallback Bus (pudur).');
            myBus = buses.find(b => b.routeName === 'pudur') || buses[0];
        }

        if (!myBus || !myBus.routeName) {
            return res.json({ success: true, stops: [], message: 'No route assigned' });
        }

        console.log('🛣️ Querying route stops for route:', myBus.routeName);

        // Fetch route stops from database
        const result = await pool.query(
            `SELECT id, stop_name as "stopName", stop_order as "stopOrder",
              latitude, longitude, pickup_time as "pickupTime", drop_time as "dropTime"
       FROM route_stops
       WHERE route_name = $1
       ORDER BY stop_order ASC`,
            [myBus.routeName]
        );

        console.log('🗄️ Database query result:', result.rows);

        let routePath = [];
        const stops = result.rows;

        console.log('📋 Final stops array:', stops);

        // Calculate detailed route path if we have enough stops
        if (stops.length >= 2) {
            try {
                // DEBUG: Check Environment and Inputs
                console.log('🔌 ORS API Key Available:', !!process.env.OPENROUTE_API_KEY);
                console.log('📍 Calculating path with', stops.length, 'stops');

                const start = { lat: parseFloat(stops[0].latitude), lng: parseFloat(stops[0].longitude) };
                const end = { lat: parseFloat(stops[stops.length - 1].latitude), lng: parseFloat(stops[stops.length - 1].longitude) };
                const waypoints = stops.slice(0, stops.length).map(s => ({ lat: parseFloat(s.latitude), lng: parseFloat(s.longitude) }));

                console.log('🚀 Calling routeCalculator with:', {
                    start,
                    end,
                    waypointsCount: waypoints.length,
                    firstWaypoint: waypoints[0]
                });

                // routeCalculator expects objects with lat/lng properties
                const pathResult = await routeCalculator.calculateRoute(
                    start,
                    end,
                    waypoints,
                    'driving-hgv' // Use Truck/Bus profile to prefer main roads/highways
                );

                if (pathResult && pathResult.coordinates && pathResult.coordinates.length > 0) {
                    // routeCalculator returns {lat, lng} objects, but Frontend Map expects [lat, lng] arrays
                    routePath = pathResult.coordinates.map(c => [c.lat, c.lng]);
                    console.log(`✅ Calculated student route path with ${routePath.length} points`);
                } else {
                    console.warn('⚠️ Path calculation returned no coordinates');
                }
            } catch (calcError) {
                console.error('⚠️ Failed to calculate student route path:', calcError.message);
            }
        }

        res.json({
            success: true,
            stops: stops,
            routeName: myBus.routeName,
            routePath: routePath // Return the detailed path
        });
    } catch (error) {
        console.error('Get route stops error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get student profile
exports.getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get bus assignment
        const buses = await Bus.findWithDrivers();
        const myBus = buses.find(b => b.id === user.bus_assigned);

        res.json({
            success: true,
            profile: {
                id: user.id,
                name: user.name,
                email: user.email,
                studentId: user.student_id,
                phone: user.phone,
                role: user.role,
                busNumber: myBus?.busNumber || null,
                routeName: myBus?.routeName || null,
                boardingStop: user.boarding_stop || null,
                droppingStop: user.dropping_stop || null,
                boardingStopTime: user.boarding_stop_time || null,
                droppingStopTime: user.dropping_stop_time || null
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================================================================
// IMPORT NEW STUDENT DASHBOARD METHODS
// ==============================================================================
const extensions = require('./_studentController_extensions');

// Export all new methods
exports.getBusStatus = extensions.getBusStatus;
exports.getETAToMyStop = extensions.getETAToMyStop;
exports.getDistanceToBus = extensions.getDistanceToBus;
exports.getNextStop = extensions.getNextStop;
exports.getMyStopDetails = extensions.getMyStopDetails;
exports.getDailySchedule = extensions.getDailySchedule;
exports.getNotifications = extensions.getNotifications;
exports.markNotificationRead = extensions.markNotificationRead;
exports.getAnnouncements = extensions.getAnnouncements;
exports.sendContactMessage = extensions.sendContactMessage;
exports.getQuickMessages = extensions.getQuickMessages;
exports.reportIssue = extensions.reportIssue;
exports.getFeedbackHistory = extensions.getFeedbackHistory;
exports.getSettings = extensions.getSettings;
exports.updateSettings = extensions.updateSettings;

// Update password
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const bcrypt = require('bcryptjs');
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const { pool } = require('../config/db');
        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, user.id]
        );

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
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
// Get student notifications (STUB)
exports.getNotifications = async (req, res) => {
    res.json({ success: true, notifications: [] });
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
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
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
        res.status(500).json({ success: false, message: error.message });
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

// ==========================================
// MISSING CONTROLLER METHODS (STUBS)
// ==========================================

exports.getNotifications = async (req, res) => {
    res.json({ success: true, notifications: [] });
};

exports.markNotificationRead = async (req, res) => {
    res.json({ success: true });
};

exports.getAnnouncements = async (req, res) => {
    res.json({ success: true, announcements: [] });
};

exports.getQuickMessages = async (req, res) => {
    res.json({ success: true, messages: {} });
};

exports.getFeedbackHistory = async (req, res) => {
    res.json({ success: true, feedback: [] });
};

exports.getSettings = async (req, res) => {
    res.json({ success: true, settings: {} });
};

exports.sendContactMessage = async (req, res) => {
    res.json({ success: true });
};

exports.reportIssue = async (req, res) => {
    res.json({ success: true });
};

exports.getMyStopDetails = async (req, res) => {
    res.json({ success: true, stops: null });
};

exports.getDailySchedule = async (req, res) => {
    res.json({ success: true, schedule: null });
};

exports.getBusStatus = async (req, res) => {
    res.json({ success: true, status: 'unknown' });
};

exports.getETAToMyStop = async (req, res) => {
    res.json({ success: true, eta: null });
};

