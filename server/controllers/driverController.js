// server/controllers/driverController.js
const Bus = require('../models/Bus');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const EmergencyAlert = require('../models/EmergencyAlert');
const { pool } = require('../config/db');
const etaService = require('../utils/etaService');

// Get driver dashboard data
exports.dashboard = async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Driver privileges required'
      });
    }

    const bus = await Bus.findOne({ driverId: user._id })
      .populate('students', 'name email studentId')
      .lean();

    res.json({
      success: true,
      driver: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      bus: bus || null
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard'
    });
  }
};

// Handle live location updates
exports.updateLiveLocation = async (req, res) => {
  try {
    const { latitude, longitude, speed, status, accuracy, updateStatusOnly } = req.body;

    // Validate session
    if (!req.session?.userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get driver
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get driver's bus
    const bus = await Bus.findOne({ driverId: user._id });
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'No bus assigned'
      });
    }

    // Prepare update
    const updateData = {
      updatedAt: new Date()
    };

    if (!updateStatusOnly) {
      if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
      if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
      if (speed !== undefined) updateData.speed = parseFloat(speed);
      if (accuracy !== undefined) updateData.accuracy = parseFloat(accuracy);
    }

    if (status) {
      updateData.status = status;
    }

    // Update bus
    const updatedBus = await Bus.findByIdAndUpdate(
      bus._id,
      updateData,
      { new: true }
    ).populate('students');

    // Broadcast via WebSocket
    const io = req.app.get('io');

    // Send to bus room
    io.to(`bus-${bus._id}`).emit('bus-live-update', {
      busId: bus._id,
      busNumber: bus.busNumber,
      latitude: updateData.latitude,
      longitude: updateData.longitude,
      speed: updateData.speed,
      status: updateData.status,
      timestamp: updateData.updatedAt
    });

    // Update tracking count
    const studentCount = updatedBus.students?.length || 0;
    io.to(`bus-${bus._id}`).emit('tracking-count', {
      busId: bus._id,
      count: studentCount
    });

    res.json({
      success: true,
      message: 'Location updated',
      trackingCount: studentCount,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get driver's assigned bus
exports.getMyBus = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find bus assigned to this driver
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    if (!myBus) {
      return res.json({ success: true, bus: null, message: 'No bus assigned' });
    }

    res.json({ success: true, bus: myBus });
  } catch (error) {
    console.error('Get my bus error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Start trip
exports.startTrip = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find driver's bus
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    if (!myBus) {
      return res.status(404).json({ success: false, message: 'No bus assigned' });
    }

    // Create trip record
    const tripData = {
      busId: myBus.id,
      driverId: user.id,
      routeName: myBus.routeName || 'Unknown Route',
      tripStatus: 'on_route'
    };

    const trip = await Trip.create(tripData);

    // Update bus status
    await Bus.findByIdAndUpdate(myBus.id, {
      status: 'moving',
      tripStartTime: new Date(),
      trip_status: 'on_route'
    });

    console.log(`✅ Trip started for bus ${myBus.busNumber}, Trip ID: ${trip.id}`);

    // Notify students via WebSocket that trip has started and location sharing is active
    const io = req.app.get('io');
    io.to(`bus-${myBus.id}`).emit('trip-started', {
      busId: myBus.id,
      busNumber: myBus.busNumber,
      driverName: user.name,
      tripId: trip.id,
      routeName: trip.routeName,
      message: 'Trip has started. Live location tracking is now active.',
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Trip started successfully. Live location sharing is now active for assigned students.',
      tripId: trip.id,
      tripStartTime: new Date()
    });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// End trip
exports.endTrip = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find driver's bus
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    if (!myBus) {
      return res.status(404).json({ success: false, message: 'No bus assigned' });
    }

    // Update bus status
    await Bus.findByIdAndUpdate(myBus.id, {
      status: 'stopped',
      tripEndTime: new Date()
    });

    console.log(`✅ Trip ended for bus ${myBus.busNumber}`);

    res.json({
      success: true,
      message: 'Trip ended successfully',
      tripEndTime: new Date()
    });
  } catch (error) {
    console.error('End trip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// ==============================================
// ROUTE & SCHEDULE MANAGEMENT
// ==============================================

// Get assigned route with stops and timings
exports.getAssignedRoute = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    if (!myBus || !myBus.routeName) {
      return res.json({ success: true, route: null, message: 'No route assigned' });
    }

    const stopsQuery = `
      SELECT 
        id,
        route_name as "routeName",
        stop_name as "stopName",
        stop_order as "stopOrder",
        latitude,
        longitude,
        pickup_time as "pickupTime",
        drop_time as "dropTime"
      FROM route_stops
      WHERE route_name = $1
      ORDER BY stop_order ASC
    `;

    const stopsResult = await pool.query(stopsQuery, [myBus.routeName]);
    const totalDistance = etaService.calculateTotalRouteDistance(stopsResult.rows);

    res.json({
      success: true,
      route: {
        routeName: myBus.routeName,
        busNumber: myBus.busNumber,
        stops: stopsResult.rows,
        totalStops: stopsResult.rows.length,
        totalDistance: totalDistance
      }
    });
  } catch (error) {
    console.error('Get assigned route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tripsQuery = `
      SELECT 
        id,
        bus_id as "busId",
        trip_status as "tripStatus",
        trip_start_time as "tripStartTime",
        trip_end_time as "tripEndTime",
        route_name as "routeName",
        total_distance as "totalDistance",
        average_speed as "averageSpeed"
      FROM trips
      WHERE driver_id = $1 AND trip_start_time >= $2
      ORDER BY trip_start_time DESC
    `;

    const result = await pool.query(tripsQuery, [user.id, todayStart]);

    res.json({
      success: true,
      schedule: {
        date: new Date().toISOString().split('T')[0],
        trips: result.rows,
        totalTrips: result.rows.length,
        completedTrips: result.rows.filter(t => t.tripStatus === 'completed').length
      }
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCurrentStop = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { stopIndex } = req.body;
    const user = await User.findById(req.session.userId);
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    if (!myBus) {
      return res.status(404).json({ success: false, message: 'No bus assigned' });
    }

    await Bus.findByIdAndUpdate(myBus.id, { current_stop_index: stopIndex });
    res.json({ success: true, message: 'Current stop updated', stopIndex });
  } catch (error) {
    console.error('Update current stop error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// DELAY REPORTING
// ==============================================

exports.reportDelay = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { reason, minutes, customMessage, latitude, longitude } = req.body;
    const user = await User.findById(req.session.userId);
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    if (!myBus) {
      return res.status(404).json({ success: false, message: 'No bus assigned' });
    }

    const currentTrip = await Trip.getCurrentTrip(myBus.id);

    const delayQuery = `
      INSERT INTO delays (
        bus_id, driver_id, trip_id, delay_reason, delay_minutes, 
        custom_message, latitude, longitude
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, reported_at as "reportedAt"
    `;

    const values = [myBus.id, user.id, currentTrip?.id || null, reason, minutes, customMessage || null, latitude || null, longitude || null];
    const result = await pool.query(delayQuery, values);

    await Bus.findByIdAndUpdate(myBus.id, { delay_status: true, delay_reason: reason });

    const io = req.app.get('io');
    io.to(`bus-${myBus.id}`).emit('driver-delay-update', {
      busId: myBus.id,
      busNumber: myBus.busNumber,
      delayReason: reason,
      delayMinutes: minutes,
      customMessage: customMessage,
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Delay reported successfully', delay: result.rows[0] });
  } catch (error) {
    console.error('Report delay error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDelayHistory = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);

    const delaysQuery = `
      SELECT 
        id,
        delay_reason as "delayReason",
        delay_minutes as "delayMinutes",
        custom_message as "customMessage",
        reported_at as "reportedAt"
      FROM delays
      WHERE driver_id = $1
      ORDER BY reported_at DESC
      LIMIT 20
    `;

    const result = await pool.query(delaysQuery, [user.id]);
    res.json({ success: true, delays: result.rows });
  } catch (error) {
    console.error('Get delay history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// STUDENT MANAGEMENT
// ==============================================

exports.getStudentPickupList = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    if (!myBus || !myBus.routeName) {
      return res.json({ success: true, students: [], message: 'No route assigned' });
    }

    const studentsQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.student_id as "studentId",
        u.boarding_stop as "boardingStop",
        u.dropping_stop as "droppingStop",
        u.boarding_stop_time as "boardingTime",
        u.dropping_stop_time as "droppingTime"
      FROM users u
      WHERE u.bus_assigned = $1 AND u.role = 'student'
      ORDER BY u.boarding_stop, u.name
    `;

    const result = await pool.query(studentsQuery, [myBus.id]);

    const studentsByStop = result.rows.reduce((acc, student) => {
      const stop = student.boardingStop || 'Unknown Stop';
      if (!acc[stop]) acc[stop] = [];
      acc[stop].push(student);
      return acc;
    }, {});

    res.json({
      success: true,
      students: result.rows,
      studentsByStop: studentsByStop,
      totalStudents: result.rows.length
    });
  } catch (error) {
    console.error('Get student list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// NOTIFICATIONS
// ==============================================

exports.getNotifications = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    const notifications = await Notification.findByRecipient('driver', user.id);
    const unreadCount = await Notification.getUnreadCount('driver', user.id);

    res.json({ success: true, notifications: notifications, unreadCount: unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.markAsRead(parseInt(id));
    res.json({ success: true, notification: notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// EMERGENCY & MESSAGES
// ==============================================

exports.sendEmergencyAlert = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { alertType, message, latitude, longitude } = req.body;
    const user = await User.findById(req.session.userId);
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    const alert = await EmergencyAlert.create({
      driverId: user.id,
      busId: myBus?.id || null,
      alertType: alertType,
      message: message,
      latitude: latitude,
      longitude: longitude
    });

    const io = req.app.get('io');
    io.emit('driver-emergency', {
      alert: alert,
      driver: { id: user.id, name: user.name, phone: user.phone },
      bus: myBus
    });

    res.json({ success: true, message: 'Emergency alert sent successfully', alert: alert });
  } catch (error) {
    console.error('Send emergency alert error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendQuickMessage = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { messageId, customMessage } = req.body;
    const user = await User.findById(req.session.userId);
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    if (!myBus) {
      return res.status(404).json({ success: false, message: 'No bus assigned' });
    }

    let messageText = customMessage;

    if (messageId && !customMessage) {
      const messageQuery = `SELECT message_text FROM quick_messages WHERE id = $1 AND is_active = true`;
      const result = await pool.query(messageQuery, [messageId]);
      if (result.rows.length > 0) {
        messageText = result.rows[0].message_text;
      }
    }

    await Bus.findByIdAndUpdate(myBus.id, { last_message_time: new Date() });

    const io = req.app.get('io');
    io.to(`bus-${myBus.id}`).emit('driver-message', {
      busId: myBus.id,
      busNumber: myBus.busNumber,
      driverName: user.name,
      message: messageText,
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Message sent successfully', sentMessage: messageText });
  } catch (error) {
    console.error('Send quick message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getQuickMessages = async (req, res) => {
  try {
    const messagesQuery = `
      SELECT id, message_text as "messageText", message_type as "messageType"
      FROM quick_messages
      WHERE is_active = true
      ORDER BY message_type, id
    `;

    const result = await pool.query(messagesQuery);
    res.json({ success: true, messages: result.rows });
  } catch (error) {
    console.error('Get quick messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// PROFILE & SETTINGS
// ==============================================

exports.getProfile = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);
    const stats = await Trip.getDriverStats(user.id, 30);

    res.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedBus: myBus ? { busNumber: myBus.busNumber, routeName: myBus.routeName } : null,
        stats: stats
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);

    const settingsQuery = `
      SELECT 
        language,
        theme,
        notifications_enabled as "notificationsEnabled",
        sound_enabled as "soundEnabled",
        auto_start_tracking as "autoStartTracking"
      FROM driver_settings
      WHERE driver_id = $1
    `;

    const result = await pool.query(settingsQuery, [user.id]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        settings: {
          language: 'en',
          theme: 'light',
          notificationsEnabled: true,
          soundEnabled: true,
          autoStartTracking: false
        }
      });
    }

    res.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    const { language, theme, notificationsEnabled, soundEnabled, autoStartTracking } = req.body;

    const upsertQuery = `
      INSERT INTO driver_settings (
        driver_id, language, theme, notifications_enabled, sound_enabled, auto_start_tracking
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (driver_id) DO UPDATE SET
        language = EXCLUDED.language,
        theme = EXCLUDED.theme,
        notifications_enabled = EXCLUDED.notifications_enabled,
        sound_enabled = EXCLUDED.sound_enabled,
        auto_start_tracking = EXCLUDED.auto_start_tracking,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [user.id, language, theme, notificationsEnabled, soundEnabled, autoStartTracking];
    const result = await pool.query(upsertQuery, values);

    res.json({ success: true, message: 'Settings updated successfully', settings: result.rows[0] });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBusDetails = async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findById(req.session.userId);
    const buses = await Bus.findWithDrivers();
    const myBus = buses.find(b => b.driverId === user.id);

    if (!myBus) {
      return res.json({ success: true, bus: null, message: 'No bus assigned' });
    }

    res.json({
      success: true,
      bus: {
        id: myBus.id,
        busNumber: myBus.busNumber,
        routeName: myBus.routeName,
        capacity: myBus.capacity,
        status: myBus.status,
        currentPassengers: myBus.currentPassengers,
        latitude: myBus.latitude,
        longitude: myBus.longitude,
        tripStatus: myBus.trip_status || 'idle',
        delayStatus: myBus.delay_status || false
      }
    });
  } catch (error) {
    console.error('Get bus details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
