-- Migration: Add boarding and dropping stop information to users table
-- File: 003_add_student_stops.sql

-- Add boarding and dropping stop columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS boarding_stop VARCHAR(255),
  ADD COLUMN IF NOT EXISTS dropping_stop VARCHAR(255),
  ADD COLUMN IF NOT EXISTS boarding_stop_time TIME,
  ADD COLUMN IF NOT EXISTS dropping_stop_time TIME;

-- Create route_stops table for storing all stops along routes
CREATE TABLE IF NOT EXISTS route_stops (
  id SERIAL PRIMARY KEY,
  route_name VARCHAR(255) NOT NULL,
  stop_name VARCHAR(255) NOT NULL,
  stop_order INTEGER NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  pickup_time TIME,
  drop_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster route lookups
CREATE INDEX IF NOT EXISTS idx_route_stops_route_name ON route_stops(route_name);
CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops(route_name, stop_order);

-- Insert sample route stops (you can customize these)
INSERT INTO route_stops (route_name, stop_name, stop_order, latitude, longitude, pickup_time, drop_time)
VALUES 
  ('iyer bunglow', 'College Main Gate', 1, 20.5937, 78.9629, '08:00:00', '17:00:00'),
  ('iyer bunglow', 'Iyer Bunglow Stop', 2, 20.6000, 78.9700, '08:15:00', '16:45:00'),
  ('iyer bunglow', 'Market Square', 3, 20.6100, 78.9800, '08:30:00', '16:30:00')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE route_stops IS 'Stores all stops for each bus route with timing information';
COMMENT ON COLUMN users.boarding_stop IS 'Students boarding point on the route';
COMMENT ON COLUMN users.dropping_stop IS 'Students dropping point on the route';
