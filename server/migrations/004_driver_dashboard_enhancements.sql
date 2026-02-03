-- Migration: Driver Dashboard Enhancements
-- File: 004_driver_dashboard_enhancements.sql
-- Description: Adds tables and columns for enhanced driver dashboard functionality

-- Create trips table for trip tracking and history
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  bus_id INTEGER REFERENCES buses(id) ON DELETE CASCADE,
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  trip_status VARCHAR(50) DEFAULT 'idle', -- idle, on_route, completed
  trip_start_time TIMESTAMP,
  trip_end_time TIMESTAMP,
  route_name VARCHAR(255),
  total_distance DECIMAL(10, 2),
  average_speed DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create delays table for delay reporting
CREATE TABLE IF NOT EXISTS delays (
  id SERIAL PRIMARY KEY,
  bus_id INTEGER REFERENCES buses(id) ON DELETE CASCADE,
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  delay_reason VARCHAR(50), -- traffic, breakdown, weather, other
  delay_minutes INTEGER,
  custom_message TEXT,
  reported_at TIMESTAMP DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  recipient_type VARCHAR(20), -- driver, student, admin, all
  recipient_id INTEGER, -- specific user ID or NULL for broadcast
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255),
  message TEXT,
  notification_type VARCHAR(50), -- info, warning, alert, route_change
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create emergency_alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  bus_id INTEGER REFERENCES buses(id) ON DELETE SET NULL,
  alert_type VARCHAR(50), -- breakdown, accident, medical, other
  message TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'active', -- active, resolved, false_alarm
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create quick_messages table
CREATE TABLE IF NOT EXISTS quick_messages (
  id SERIAL PRIMARY KEY,
  message_text VARCHAR(255) NOT NULL,
  message_type VARCHAR(50), -- delay, arrival, departure, custom
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create driver_settings table
CREATE TABLE IF NOT EXISTS driver_settings (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) DEFAULT 'en', -- en, hi
  theme VARCHAR(20) DEFAULT 'light', -- light, dark
  notifications_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  auto_start_tracking BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Modify buses table (add new columns)
ALTER TABLE buses 
  ADD COLUMN IF NOT EXISTS trip_status VARCHAR(50) DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS current_stop_index INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delay_status BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS delay_reason VARCHAR(50),
  ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(trip_status);
CREATE INDEX IF NOT EXISTS idx_delays_bus_id ON delays(bus_id);
CREATE INDEX IF NOT EXISTS idx_delays_trip_id ON delays(trip_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_driver ON emergency_alerts(driver_id);

-- Insert default quick messages
INSERT INTO quick_messages (message_text, message_type) VALUES
  ('Bus delayed due to traffic', 'delay'),
  ('Trip started successfully', 'departure'),
  ('Reached destination', 'arrival'),
  ('Running on schedule', 'custom'),
  ('Bus breakdown - please wait', 'delay'),
  ('On the way', 'custom'),
  ('Next stop in 5 minutes', 'custom')
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE trips IS 'Stores trip history and current trip status for buses';
COMMENT ON TABLE delays IS 'Records delay reports from drivers with reasons and location';
COMMENT ON TABLE notifications IS 'Stores notifications for drivers, students, and admins';
COMMENT ON TABLE emergency_alerts IS 'Emergency alerts triggered by drivers';
COMMENT ON TABLE quick_messages IS 'Predefined quick messages for drivers to send';
COMMENT ON TABLE driver_settings IS 'Driver-specific app settings and preferences';
