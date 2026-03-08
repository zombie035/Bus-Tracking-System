-- Test script to verify bus and route data
-- Run this in your PostgreSQL database

-- 1. Check if bus 121 exists in buses table
SELECT * FROM buses WHERE bus_number = '121';

-- 2. Check if driver raj is assigned to bus 121
SELECT u.id, u.name, u.phone, u.bus_assigned 
FROM users u 
WHERE u.name = 'raj' AND u.role = 'driver';

-- 3. Check route stops for bus 121's route
-- First get the route name for bus 121
SELECT route_name FROM buses WHERE bus_number = '121';

-- Then get stops for that route
SELECT * FROM route_stops WHERE route_name = 'College Route 121' ORDER BY stop_order;

-- 4. If no route stops exist, insert sample data for testing
INSERT INTO route_stops (
    stop_name, stop_order, latitude, longitude, route_name, 
    pickup_time, drop_time, created_at
) VALUES 
    ('College Entrance', 1, 9.9252, 78.1198, 'College Route 121', '08:00', '08:05', NOW()),
    ('Administration Block', 2, 9.9262, 78.1208, 'College Route 121', '08:10', '08:15', NOW()),
    ('Computer Science Dept', 3, 9.9272, 78.1218, 'College Route 121', '08:20', '08:25', NOW()),
    ('Canteen', 4, 9.9282, 78.1228, 'College Route 121', '08:30', '08:35', NOW()),
    ('Library', 5, 9.9292, 78.1238, 'College Route 121', '08:40', '08:45', NOW()),
    ('Sports Ground', 6, 9.9302, 78.1248, 'College Route 121', '08:50', '08:55', NOW()),
    ('Hostel Block', 7, 9.9312, 78.1258, 'College Route 121', '09:00', '09:05', NOW());

-- 5. Update bus 121 with route assignment
UPDATE buses 
SET route_name = 'College Route 121', 
    status = 'active',
    updated_at = NOW()
WHERE bus_number = '121';

-- 6. Verify the data
SELECT 
    b.bus_number,
    b.route_name,
    b.status,
    COUNT(rs.id) as stop_count
FROM buses b
LEFT JOIN route_stops rs ON b.route_name = rs.route_name
WHERE b.bus_number = '121'
GROUP BY b.bus_number, b.route_name, b.status;
