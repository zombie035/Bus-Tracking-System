// Append these methods to driverController.js after the endTrip function

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

        // Get route stops from database
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

        // Calculate total distance
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

// Get today's schedule
exports.getSchedule = async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await User.findById(req.session.userId);

        // Get trips for today
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

// Update current stop index
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

        await Bus.findByIdAndUpdate(myBus.id, {
            current_stop_index: stopIndex
        });

        res.json({ success: true, message: 'Current stop updated', stopIndex });
    } catch (error) {
        console.error('Update current stop error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================================
// DELAY REPORTING
// ==============================================

// Report delay
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

        // Get current trip
        const currentTrip = await Trip.getCurrentTrip(myBus.id);

        // Insert delay record
        const delayQuery = `
      INSERT INTO delays (
        bus_id, driver_id, trip_id, delay_reason, delay_minutes, 
        custom_message, latitude, longitude
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, reported_at as "reportedAt"
    `;

        const values = [
            myBus.id,
            user.id,
            currentTrip?.id || null,
            reason,
            minutes,
            customMessage || null,
            latitude || null,
            longitude || null
        ];

        const result = await pool.query(delayQuery, values);

        // Update bus delay status
        await Bus.findByIdAndUpdate(myBus.id, {
            delay_status: true,
            delay_reason: reason
        });

        // Broadcast delay to students via WebSocket
        const io = req.app.get('io');
        io.to(`bus-${myBus.id}`).emit('driver-delay-update', {
            busId: myBus.id,
            busNumber: myBus.busNumber,
            delayReason: reason,
            delayMinutes: minutes,
            customMessage: customMessage,
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Delay reported successfully',
            delay: result.rows[0]
        });
    } catch (error) {
        console.error('Report delay error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get delay history
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

        res.json({
            success: true,
            delays: result.rows
        });
    } catch (error) {
        console.error('Get delay history error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================================
// STUDENT MANAGEMENT
// ==============================================

// Get student pickup list (stop-wise)
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

        // Get students assigned to this bus with their boarding/dropping stops
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

        // Group students by boarding stop
        const studentsByStop = result.rows.reduce((acc, student) => {
            const stop = student.board ingStop || 'Unknown Stop';
            if (!acc[stop]) {
                acc[stop] = [];
            }
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

// REST OF THE METHODS CONTINUED IN NEXT FILE...
