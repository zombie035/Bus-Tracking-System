-- server/check_user_bus.sql
-- Quick query to check if sample@college.edu has a bus assigned

SELECT 
    u.id,
    u.name,
    u.email,
    u.bus_assigned,
    b.bus_number,
    b.route_name
FROM users u
LEFT JOIN buses b ON u.bus_assigned = b.id
WHERE u.email = 'sample@college.edu';
