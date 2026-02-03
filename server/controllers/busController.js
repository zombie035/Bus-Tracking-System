// controllers/busController.js
const { pool } = require('../config/db');
const Bus = require('../models/Bus');

// Get all buses
exports.getBuses = async (req, res) => {
  try {
    console.log('🚌 Fetching all buses...');
    console.log('   Request from:', req.ip);
    console.log('   Session:', req.session?.userId ? `User ${req.session.userId}` : 'No session');

    // Using Bus model's findWithDrivers method
    console.log('   Calling Bus.findWithDrivers()...');
    const buses = await Bus.findWithDrivers();

    console.log(`   ✅ Found ${buses.length} buses from database`);
    console.log('   First bus (if any):', buses[0]);

    const response = {
      success: true,
      buses: buses,
      count: buses.length
    };

    console.log('   Sending response with', response.count, 'buses');
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching buses:', error);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buses',
      error: error.message
    });
  }
};

// Get single bus
exports.getBus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Getting bus:', id);

    const bus = await Bus.findById(id);

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    res.json({
      success: true,
      bus: bus
    });
  } catch (error) {
    console.error('Error fetching bus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bus'
    });
  }
};

// Create new bus
exports.createBus = async (req, res) => {
  try {
    console.log('➕ Creating new bus with data:', req.body);
    const { busNumber, routeName, capacity, status, driverId, latitude, longitude } = req.body;

    // Validate required fields
    if (!busNumber || !busNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Bus number is required'
      });
    }

    if (!routeName || !routeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Route name is required'
      });
    }

    if (!capacity || capacity < 1 || capacity > 100) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be between 1 and 100'
      });
    }

    // Check for duplicate bus number
    const existing = await pool.query('SELECT id, bus_number FROM buses WHERE bus_number = $1', [busNumber]);
    if (existing.rows.length > 0) {
      console.log(`⚠️ Duplicate bus number detected: ${busNumber}`);
      return res.status(400).json({
        success: false,
        message: `Bus number "${busNumber}" already exists. Please use a different bus number.`
      });
    }

    // Create the bus
    const bus = await Bus.create(req.body);

    console.log('✅ Bus created successfully:', bus);
    res.status(201).json({
      success: true,
      bus,
      message: `Bus ${busNumber} created successfully`
    });
  } catch (error) {
    console.error('❌ Error creating bus:', error);
    console.error('Error details:', error.stack);

    // Handle specific database errors
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Bus number already exists'
      });
    }

    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID or route reference'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create bus: ' + error.message
    });
  }
};

exports.updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Updating bus ${id} with data:`, req.body);

    // Validate bus ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid bus ID"
      });
    }

    // Check if bus exists
    const existingBus = await Bus.findById(id);
    if (!existingBus) {
      console.log(`⚠️ Bus not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    // Validate updated data if provided
    if (req.body.capacity && (req.body.capacity < 1 || req.body.capacity > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be between 1 and 100'
      });
    }

    // Check for duplicate bus number if it's being changed
    if (req.body.busNumber && req.body.busNumber !== existingBus.busNumber) {
      const duplicate = await pool.query(
        'SELECT id FROM buses WHERE bus_number = $1 AND id != $2',
        [req.body.busNumber, id]
      );
      if (duplicate.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Bus number "${req.body.busNumber}" already exists`
        });
      }
    }

    console.log('📝 Update data received:');
    console.log('   - busNumber:', req.body.busNumber);
    console.log('   - routeName:', req.body.routeName);
    console.log('   - driverId:', req.body.driverId, '(type:', typeof req.body.driverId, ')');
    console.log('   - capacity:', req.body.capacity);
    console.log('   - status:', req.body.status);

    // Update the bus
    const bus = await Bus.findByIdAndUpdate(id, req.body);

    console.log('✅ Bus updated successfully:', bus);
    res.json({
      success: true,
      bus,
      message: `Bus updated successfully`
    });
  } catch (err) {
    console.error('❌ Error updating bus:', err);
    console.error('Error details:', err.stack);

    // Handle specific database errors
    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Bus number already exists'
      });
    }

    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID or route reference'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update bus: ' + err.message
    });
  }
};

exports.deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting bus ${id}`);

    // Validate bus ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid bus ID"
      });
    }

    // Check if bus exists before deleting
    const existingBus = await Bus.findById(id);
    if (!existingBus) {
      console.log(`⚠️ Bus not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    // Delete the bus
    const bus = await Bus.findByIdAndDelete(id);

    console.log(`✅ Bus deleted successfully: ${existingBus.busNumber}`);
    res.json({
      success: true,
      message: `Bus ${existingBus.busNumber} deleted successfully`,
      deletedBus: existingBus
    });
  } catch (err) {
    console.error('❌ Error deleting bus:', err);
    console.error('Error details:', err.stack);

    // Handle foreign key constraint errors (e.g., if bus is referenced elsewhere)
    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete bus because it is referenced by other records'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete bus: ' + err.message
    });
  }
};

// Get available drivers
exports.getAvailableDrivers = async (req, res) => {
  try {
    console.log('👨‍✈️ Fetching available drivers...');

    const result = await pool.query(
      "SELECT id, name, email, phone FROM users WHERE role = 'driver' ORDER BY name"
    );

    res.json({
      success: true,
      drivers: result.rows
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers'
    });
  }
};

// Update bus location
exports.updateBusLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, speed, status, engine_status, direction } = req.body;

    console.log('📍 Updating bus location:', id, { latitude, longitude, speed, engine_status });

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Logic for idle_start_time:
    // If speed is 0 and engine is ON, start counting idle time if not already started
    // If speed > 0 or engine OFF, reset idle_start_time
    // But this logic is tricky in a single query unless we know previous state.
    // For simplicity: We will update it in the query using CASE

    const result = await pool.query(
      `UPDATE buses 
       SET 
         latitude = $1, 
         longitude = $2, 
         speed = $3, 
         status = $4,
         engine_status = COALESCE($5, engine_status),
         direction = COALESCE($6, direction),
         updated_at = NOW(),
         idle_start_time = CASE 
           WHEN $3 = 0 AND COALESCE($5, engine_status) = 'ON' AND idle_start_time IS NULL THEN NOW()
           WHEN $3 > 0 OR COALESCE($5, engine_status) = 'OFF' THEN NULL
           ELSE idle_start_time
         END
       WHERE id = $7
       RETURNING *`,
      [latitude, longitude, speed || 0, status || 'moving', engine_status, direction, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    const bus = result.rows[0];

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`bus-${id}`).emit('bus-location-update', {
        busId: id,
        busNumber: bus.bus_number,
        latitude: bus.latitude,
        longitude: bus.longitude,
        speed: bus.speed,
        status: bus.status,
        engine_status: bus.engine_status,
        direction: bus.direction,
        idle_start_time: bus.idle_start_time,
        timestamp: new Date()
      });

      // Also broadcast to admin channel if needed (or just relying on the client joining room? 
      // Admin might not join specific bus rooms. Let's emit a global event for admins too)
      io.emit('bus-live-update', {
        busId: id,
        ...bus,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Bus location updated',
      bus: bus
    });
  } catch (error) {
    console.error('Error updating bus location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bus location'
    });
  }
};

exports.getBusByNumber = async (req, res) => {
  try {
    const { busNumber } = req.params;
    const result = await pool.query(
      'SELECT * FROM buses WHERE bus_number = $1',
      [busNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bus not found'
      });
    }

    res.json({
      success: true,
      bus: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching bus by number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bus'
    });
  }
};

exports.getBusesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const result = await pool.query(
      'SELECT * FROM buses WHERE status = $1',
      [status]
    );

    res.json({
      success: true,
      buses: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching buses by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buses'
    });
  }
};

exports.getLiveBuses = async (req, res) => {
  try {
    // Return buses with recent updates (last 5 minutes)
    const result = await pool.query(
      `SELECT * FROM buses 
       WHERE status IN ('active', 'moving') 
       AND updated_at > NOW() - INTERVAL '5 minutes'
       ORDER BY updated_at DESC`
    );

    res.json({
      success: true,
      buses: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching live buses:', error);
    // Fallback to all buses
    return exports.getBuses(req, res);
  }
};