// controllers/adminController.js
const User = require('../models/User');
const Bus = require('../models/Bus');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// Admin Dashboard
exports.dashboard = async (req, res) => {
  try {
    // Get counts for dashboard
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    const totalStudentsResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['student']);
    const totalStudents = parseInt(totalStudentsResult.rows[0].count);

    const totalDriversResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['driver']);
    const totalDrivers = parseInt(totalDriversResult.rows[0].count);

    const totalAdminsResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['admin']);
    const totalAdmins = parseInt(totalAdminsResult.rows[0].count);

    const totalBusesResult = await pool.query('SELECT COUNT(*) as count FROM buses');
    const totalBuses = parseInt(totalBusesResult.rows[0].count);

    // Get active buses (updated in last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeBusesResult = await pool.query('SELECT COUNT(*) as count FROM buses WHERE updated_at >= $1', [tenMinutesAgo]);
    const activeBuses = parseInt(activeBusesResult.rows[0].count);

    // Get recent buses
    const recentBusesResult = await pool.query(`
      SELECT b.*, u.name as driver_name, u.email as driver_email
      FROM buses b
      LEFT JOIN users u ON b.driver_id = u.id
      ORDER BY b.updated_at DESC
      LIMIT 5
    `);
    const recentBuses = recentBusesResult.rows;

    // Get recent users
    const recentUsersResult = await pool.query(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    const recentUsers = recentUsersResult.rows;

    // Return JSON response
    res.json({
      success: true,
      message: 'Admin dashboard data',
      user: req.session,
      stats: {
        totalUsers,
        totalStudents,
        totalDrivers,
        totalAdmins,
        totalBuses,
        activeBuses,
        inactiveBuses: totalBuses - activeBuses
      },
      recentBuses,
      recentUsers
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading dashboard',
      error: error.message
    });
  }
};

// Get all users
// In adminController.js, update getUsers function:
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        student_id as "studentId", 
        phone, 
        bus_assigned as "busAssigned", 
        created_at as "createdAt"
      FROM users 
      ORDER BY id DESC
    `);
    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error', users: [] });
  }
};

// Create User (FIXED LOGIC)
exports.createUser = async (req, res) => {
  try {
    const { name, role } = req.body;

    // Sanitize inputs: Convert empty strings to null
    const email = req.body.email ? req.body.email.trim() : null;
    const phone = req.body.phone ? req.body.phone.trim() : null;
    const studentId = req.body.studentId ? req.body.studentId.trim() : null;
    const busAssigned = req.body.busAssigned ? parseInt(req.body.busAssigned) : null;
    let password = req.body.password;

    // 1. Validation based on Role
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (role !== 'student' && role !== 'driver') return res.status(400).json({ message: 'Invalid role' });

    // Driver Specifics
    if (role === 'driver') {
      if (!phone) return res.status(400).json({ message: 'Phone number is required for drivers' });
      if (!password) password = phone; // Default password is phone for drivers
    }

    // Student Specifics
    if (role === 'student') {
      if (!email) return res.status(400).json({ message: 'Email is required for students' });
      if (!studentId) return res.status(400).json({ message: 'Student ID is required' });
      if (!password) return res.status(400).json({ message: 'Password is required' });
    }

    // 2. Check Duplicates
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) return res.status(400).json({ message: 'Email already exists' });
    }

    if (phone) {
      const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
      if (phoneCheck.rows.length > 0) return res.status(400).json({ message: 'Phone number already exists' });
    }

    if (studentId) {
      const idCheck = await pool.query('SELECT id FROM users WHERE student_id = $1', [studentId]);
      if (idCheck.rows.length > 0) return res.status(400).json({ message: 'Student ID already exists' });
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert into Database
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, student_id, phone, bus_assigned)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, student_id, phone`,
      [name, email, hashedPassword, role, studentId, phone, busAssigned]
    );

    res.status(201).json({ success: true, user: result.rows[0] });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Update User (FIXED LOGIC)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    // Sanitize inputs
    const email = req.body.email ? req.body.email.trim() : null;
    const phone = req.body.phone ? req.body.phone.trim() : null;
    const studentId = req.body.studentId ? req.body.studentId.trim() : null;
    const busAssigned = req.body.busAssigned ? parseInt(req.body.busAssigned) : null;

    // 1. Validation
    if (role === 'student' && !email) return res.status(400).json({ message: 'Email is required for students' });
    if (role === 'driver' && !phone) return res.status(400).json({ message: 'Phone is required for drivers' });

    // 2. Check Duplicates (Excluding current user)
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) return res.status(400).json({ message: 'Email already used by another user' });
    }

    // 3. Update Database
    // We intentionally do NOT update the password here (handled via separate endpoint usually)
    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, role = $3, student_id = $4, phone = $5, bus_assigned = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, email, role, student_id, phone, bus_assigned`,
      [name, email, role, studentId, phone, busAssigned, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, user: result.rows[0] });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: Check if user exists first

    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// API: Get single user
exports.getUser = async (req, res) => {
  try {
    console.log('🔵 Getting user:', req.params.id);
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.student_id,
        phone: user.phone,
        createdAt: user.created_at,
        busAssigned: user.busAssigned || user.bus_assigned
      }
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

// Bulk import users (simple version)
// In adminController.js, update the bulkImport function
exports.bulkImport = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users provided'
      });
    }

    const results = [];
    const errors = [];

    for (const userData of users) {
      try {
        // Validate role
        if (userData.role !== 'student' && userData.role !== 'driver') {
          errors.push({
            email: userData.email,
            error: 'Invalid role. Must be student or driver.'
          });
          continue;
        }

        // Check if user already exists
        // Use email or phone to check existence
        let exists = false;
        if (userData.email) {
          const check = await pool.query('SELECT id FROM users WHERE email = $1', [userData.email]);
          if (check.rows.length > 0) exists = true;
        }
        if (!exists && userData.phone) {
          const check = await pool.query('SELECT id FROM users WHERE phone = $1', [userData.phone]);
          if (check.rows.length > 0) exists = true;
        }

        if (exists) {
          errors.push({
            email: userData.email,
            error: 'User already exists'
          });
          continue;
        }

        // Determine password
        let plainPassword = userData.password;
        if (userData.role === 'driver' && !plainPassword) {
          plainPassword = userData.phone; // Driver password = phone
        }
        if (!plainPassword) plainPassword = 'password123'; // Fallback

        // Hash password
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Insert user
        const result = await pool.query(
          `INSERT INTO users (name, email, password, role, student_id, phone, bus_assigned, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
           RETURNING id, name, email, role, student_id, phone, bus_assigned`,
          [
            userData.name,
            userData.email || null,
            hashedPassword,
            userData.role,
            userData.studentId || null,
            userData.phone || null,
            null // bus_assigned, can be updated later
          ]
        );

        results.push({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          status: 'success',
          id: result.rows[0].id
        });
      } catch (error) {
        console.error('Error creating user:', error);
        errors.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Imported ${results.length} users successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during bulk import: ' + error.message
    });
  }
};

// ========== ROUTE MANAGEMENT ==========

// Get all routes
exports.getRoutes = async (req, res) => {
  try {
    console.log('🔵 Fetching routes...');
    const { search } = req.query;

    let query = 'SELECT * FROM routes WHERE 1=1';
    const values = [];

    if (search) {
      query += ' AND (route_name ILIKE $' + (values.length + 1) + ' OR route_number ILIKE $' + (values.length + 2) + ')';
      values.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    const routes = result.rows.map(row => ({
      _id: row.id,
      id: row.id,
      routeName: row.route_name,
      routeNumber: row.route_number,
      startingPoint: row.starting_point,
      destinationPoint: row.destination_point,
      stops: row.stops ? JSON.parse(row.stops) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    console.log(`✅ Found ${routes.length} routes`);

    res.json({
      success: true,
      routes: routes
    });
  } catch (error) {
    console.error('❌ Get routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading routes: ' + error.message,
      routes: []
    });
  }
};

// Create new route
exports.createRoute = async (req, res) => {
  try {
    console.log('🔵 Creating route with data:', req.body);
    const { routeName, routeNumber, startingPoint, destinationPoint, stops = [] } = req.body;

    // Validate required fields
    if (!routeName || !startingPoint || !destinationPoint) {
      console.warn('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Route name, starting point, and destination point are required',
        formData: { routeName, routeNumber, startingPoint, destinationPoint, stops }
      });
    }

    // Check if route number already exists (if provided)
    if (routeNumber) {
      const existingRoute = await pool.query('SELECT id FROM routes WHERE route_number = $1', [routeNumber]);
      if (existingRoute.rows.length > 0) {
        console.warn('❌ Route number already exists:', routeNumber);
        return res.status(400).json({
          success: false,
          message: 'Route number already exists',
          formData: { routeName, routeNumber, startingPoint, destinationPoint, stops }
        });
      }
    }

    // Create new route
    console.log('💾 Creating route in database...');
    const result = await pool.query(
      `INSERT INTO routes (route_name, route_number, starting_point, destination_point, stops)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [routeName, routeNumber || null, startingPoint, destinationPoint, JSON.stringify(stops)]
    );

    const route = result.rows[0];

    console.log(`✅ Route created successfully: ${routeName} (${route.id})`);

    // Sync stops to route_stops table
    if (stops && stops.length > 0) {
      await syncRouteStops(routeName, stops);
    }

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      route: {
        id: route.id,
        routeName: route.route_name,
        routeNumber: route.route_number,
        startingPoint: route.starting_point,
        destinationPoint: route.destination_point,
        stops: route.stops ? JSON.parse(route.stops) : []
      }
    });
  } catch (error) {
    console.error('❌ Create route error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: 'Error creating route: ' + error.message,
      formData: req.body
    });
  }
};

// Helper to sync stops to normalized table
async function syncRouteStops(routeName, stops) {
  try {
    console.log(`🔄 Syncing stops for route: ${routeName} (${stops.length} stops)`);

    // 1. Clear existing stops for this route
    await pool.query('DELETE FROM route_stops WHERE route_name = $1', [routeName]);

    // 2. Insert new stops
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      if (!stop.name || !stop.latitude || !stop.longitude) continue;

      await pool.query(
        `INSERT INTO route_stops 
          (route_name, stop_name, stop_order, latitude, longitude, pickup_time, drop_time)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          routeName,
          stop.name,
          i + 1, // stop_order (1-based)
          stop.latitude,
          stop.longitude,
          stop.arrivalTime || null, // Assuming arrivalTime maps to pickup for now
          stop.departureTime || null
        ]
      );
    }
    console.log('✅ Route stops synced successfully');
  } catch (error) {
    console.error('❌ Error syncing route stops:', error);
    // Don't throw, just log. We don't want to break the main route flow if this fails.
  }
}

// Get single route
exports.getRoute = async (req, res) => {
  try {
    console.log('🔵 Getting route:', req.params.id);
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM routes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    const route = result.rows[0];

    res.json({
      success: true,
      route: {
        _id: route.id,
        id: route.id,
        routeName: route.route_name,
        routeNumber: route.route_number,
        startingPoint: route.starting_point,
        destinationPoint: route.destination_point,
        stops: route.stops ? JSON.parse(route.stops) : [],
        createdAt: route.created_at,
        updatedAt: route.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Get route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching route'
    });
  }
};

// Update route
exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { routeName, routeNumber, startingPoint, destinationPoint, stops } = req.body;

    const result = await pool.query(
      `UPDATE routes
       SET route_name = $1, route_number = $2, starting_point = $3, destination_point = $4, stops = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [routeName, routeNumber, startingPoint, destinationPoint, JSON.stringify(stops), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    const route = result.rows[0];

    // Sync stops to route_stops table (using the new route name)
    if (stops) {
      await syncRouteStops(routeName, stops); // Sync even if empty to clear old stops
    }

    res.json({
      success: true,
      message: 'Route updated successfully',
      route: {
        id: route.id,
        routeName: route.route_name,
        routeNumber: route.route_number,
        startingPoint: route.starting_point,
        destinationPoint: route.destination_point,
        stops: route.stops ? JSON.parse(route.stops) : []
      }
    });

  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating route: ' + error.message
    });
  }
};

// Delete route
exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM routes WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.json({
      success: true,
      message: 'Route deleted successfully'
    });

  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting route: ' + error.message
    });
  }
};

// ========== ANALYTICS ENDPOINTS ==========

// Get route analytics with student counts
exports.getRouteAnalytics = async (req, res) => {
  console.log('🔵 === ROUTE ANALYTICS CALLED ===');
  console.log('🔵 User:', req.session?.userId, 'Role:', req.session?.role);
  console.log('🔵 Pool available:', !!pool);

  try {
    console.log('🔵 Fetching route analytics...');

    // Get route statistics with student counts
    const routeStatsQuery = `
      SELECT 
        r.id,
        r.route_name,
        r.route_number,
        r.starting_point,
        r.destination_point,
        r.stops,
        COUNT(DISTINCT b.id) as bus_count,
        COUNT(DISTINCT u.id) as student_count
      FROM routes r
      LEFT JOIN buses b ON b.route_name = r.route_name
      LEFT JOIN users u ON u.bus_assigned = b.id AND u.role = 'student'
      GROUP BY r.id, r.route_name, r.route_number, r.starting_point, r.destination_point, r.stops
      ORDER BY student_count DESC
    `;

    const result = await pool.query(routeStatsQuery);
    console.log(`📊 Query returned ${result.rows.length} routes`);

    // Get total students
    const totalStudentsResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    );
    const totalStudents = parseInt(totalStudentsResult.rows[0].count);

    // Format the data with error handling for JSON parsing
    const routeStats = result.rows.map(row => {
      let stops = [];
      try {
        stops = row.stops ? JSON.parse(row.stops) : [];
      } catch (jsonError) {
        console.warn(`⚠️ Failed to parse stops for route ${row.id}:`, jsonError.message);
        stops = [];
      }

      return {
        id: row.id,
        routeName: row.route_name,
        routeNumber: row.route_number,
        startingPoint: row.starting_point,
        destinationPoint: row.destination_point,
        studentCount: parseInt(row.student_count) || 0,
        busCount: parseInt(row.bus_count) || 0,
        stops: stops,
        utilizationPercentage: totalStudents > 0 ? (parseInt(row.student_count) / totalStudents) * 100 : 0
      };
    });

    console.log(`✅ Found ${routeStats.length} routes with ${totalStudents} total students`);

    res.json({
      success: true,
      routeStats,
      totalStudents,
      totalRoutes: routeStats.length
    });

  } catch (error) {
    console.error('❌ Route analytics error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error loading route analytics: ' + error.message
    });
  }
};

// Get usage analytics
exports.getUsageAnalytics = async (req, res) => {
  try {
    console.log('📊 Fetching usage analytics...');
    const { startDate, endDate } = req.query;

    // Get active users (simplified - just counting total users by role)
    const dailyActiveUsersQuery = `
      SELECT COUNT(*) as count FROM users 
      WHERE role IN ('student', 'driver')
    `;
    const dailyResult = await pool.query(dailyActiveUsersQuery);

    //Currently returning total counts as we don't have login tracking yet
    const totalUsers = parseInt(dailyResult.rows[0].count) || 0;

    // Get bus activity
    const busActivityQuery = `
      SELECT 
        COUNT(*) as total_buses,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_buses
      FROM buses
    `;
    const busResult = await pool.query(busActivityQuery);
    const busData = busResult.rows[0];

    // Get route count for trip estimation
    const routeCountQuery = `SELECT COUNT(*) as count FROM routes`;
    const routeResult = await pool.query(routeCountQuery);
    const routeCount = parseInt(routeResult.rows[0].count) || 0;

    // Calculate estimated metrics (in real app, these would come from actual tracking data)
    const activeUsers = {
      daily: Math.floor(totalUsers * 0.6), // Estimate 60% daily active
      weekly: Math.floor(totalUsers * 0.85), // Estimate 85% weekly active
      monthly: totalUsers
    };

    const busActivity = {
      activeBuses: parseInt(busData.active_buses) || 0,
      tripsCompleted: routeCount * 2, // Estimate 2 trips per route per day
      avgTripDuration: 35 // Average 35 minutes per trip
    };

    const systemHealth = {
      driverLoginRate: 92, // Placeholder - would track actual logins
      studentCheckIns: Math.floor(totalUsers * 0.75),
      uptime: 99.8
    };

    console.log('✅ Usage analytics generated successfully');

    res.json({
      success: true,
      activeUsers,
      busActivity,
      systemHealth,
      period: {
        startDate: startDate || 'N/A',
        endDate: endDate || 'N/A'
      }
    });

  } catch (error) {
    console.error('❌ Usage analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading usage analytics: ' + error.message
    });
  }
};

// Get driver status
exports.getDriverStatus = async (req, res) => {
  try {
    console.log('👥 Fetching driver status...');

    const driversQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.updated_at as last_active,
        b.id as bus_id,
        b.bus_number,
        b.route_name,
        b.status as bus_status,
        b.updated_at as bus_last_update
      FROM users u
      LEFT JOIN buses b ON b.driver_id = u.id
      WHERE u.role = 'driver'
      ORDER BY u.name ASC
    `;

    const result = await pool.query(driversQuery);

    const drivers = result.rows.map(row => {
      // Determine if driver is online (updated in last 5 minutes)
      const lastUpdate = row.bus_last_update || row.last_active;
      const minutesSinceUpdate = lastUpdate
        ? (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60)
        : 9999;

      const isOnline = minutesSinceUpdate < 5;

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        status: isOnline ? 'online' : 'offline',
        lastActive: lastUpdate,
        currentBus: row.bus_id ? {
          id: row.bus_id,
          busNumber: row.bus_number,
          routeName: row.route_name,
          status: row.bus_status
        } : null
      };
    });

    const onlineCount = drivers.filter(d => d.status === 'online').length;

    console.log(`✅ Found ${drivers.length} drivers (${onlineCount} online)`);

    res.json({
      success: true,
      drivers,
      summary: {
        total: drivers.length,
        online: onlineCount,
        offline: drivers.length - onlineCount
      }
    });

  } catch (error) {
    console.error('❌ Driver status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading driver status: ' + error.message
    });
  }
};

