-- Student Dashboard Enhancement Migration
-- Creates necessary tables and columns for student dashboard features

-- Student Settings Table (Preferences)
CREATE TABLE IF NOT EXISTS student_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'hi')),
    notifications_enabled BOOLEAN DEFAULT true,
    bus_started_alert BOOLEAN DEFAULT true,
    bus_delayed_alert BOOLEAN DEFAULT true,
    bus_approaching_alert BOOLEAN DEFAULT true,
    emergency_alert BOOLEAN DEFAULT true,
    announcement_alert BOOLEAN DEFAULT true,
    geofence_radius INTEGER DEFAULT 500 CHECK (geofence_radius BETWEEN 100 AND 2000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Feedback/Issue Reporting Table
CREATE TABLE IF NOT EXISTS student_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('late_bus', 'wrong_stop', 'app_issue', 'driver_issue', 'safety_concern', 'other')),
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    bus_id INTEGER REFERENCES buses(id),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    admin_response TEXT,
    resolved_by INTEGER REFERENCES users(id)
);

-- Admin Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'route_change', 'holiday', 'maintenance', 'emergency', 'update')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'drivers', 'specific_route')),
    route_name VARCHAR(255),
    bus_id INTEGER REFERENCES buses(id),
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quick Contact Messages (Predefined Messages)
CREATE TABLE IF NOT EXISTS quick_contact_messages (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL CHECK (category IN ('driver', 'admin')),
    message_text TEXT NOT NULL,
    recipient VARCHAR(50) NOT NULL CHECK (recipient IN ('driver', 'admin')),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message Log (Track sent quick messages)
CREATE TABLE IF NOT EXISTS student_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES quick_contact_messages(id),
    custom_message TEXT,
    recipient_type VARCHAR(50) NOT NULL,
    bus_id INTEGER REFERENCES buses(id),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bus table enhancements (add new columns to existing buses table)
ALTER TABLE buses ADD COLUMN IF NOT EXISTS last_known_location_lat DECIMAL(10, 8);
ALTER TABLE buses ADD COLUMN IF NOT EXISTS last_known_location_lng DECIMAL(11, 8);
ALTER TABLE buses ADD COLUMN IF NOT EXISTS last_update_time TIMESTAMP;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS geofence_radius INTEGER DEFAULT 500;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS next_stop_id INTEGER;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS next_stop_name VARCHAR(255);
ALTER TABLE buses ADD COLUMN IF NOT EXISTS current_trip_started_at TIMESTAMP;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS is_delayed BOOLEAN DEFAULT FALSE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS delay_minutes INTEGER DEFAULT 0;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS delay_reason TEXT;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS trip_status VARCHAR(50) DEFAULT 'idle' CHECK (trip_status IN ('idle', 'on_route', 'delayed', 'completed'));

-- Insert default quick contact messages
INSERT INTO quick_contact_messages (category, message_text, recipient, display_order) VALUES
('driver', 'I will be 5 minutes late to the stop', 'driver', 1),
('driver', 'I am waiting at the stop now', 'driver', 2),
('driver', 'Please wait for me, I am on my way', 'driver', 3),
('driver', 'Where is the bus currently located?', 'driver', 4),
('driver', 'I missed the bus, what should I do?', 'driver', 5),
('admin', 'My bus did not arrive today', 'admin', 1),
('admin', 'Wrong route has been assigned to me', 'admin', 2),
('admin', 'The app is not working properly', 'admin', 3),
('admin', 'I would like to request a route change', 'admin', 4),
('admin', 'Bus timings need to be updated', 'admin', 5)
ON CONFLICT DO NOTHING;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_student_settings_user ON student_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON student_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON student_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON student_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_route ON announcements(route_name) WHERE route_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buses_location ON buses(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_buses_trip_status ON buses(trip_status);
CREATE INDEX IF NOT EXISTS idx_student_messages_user ON student_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_student_messages_created ON student_messages(created_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_student_settings_updated_at ON student_settings;
CREATE TRIGGER update_student_settings_updated_at
    BEFORE UPDATE ON student_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for existing students
INSERT INTO student_settings (user_id)
SELECT id FROM users WHERE role = 'student'
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE student_settings IS 'Stores student preferences for theme, language, and notification settings';
COMMENT ON TABLE student_feedback IS 'Stores student feedback and issue reports';
COMMENT ON TABLE announcements IS 'Stores admin announcements for students';
COMMENT ON TABLE quick_contact_messages IS 'Predefined messages students can send to drivers/admin';
COMMENT ON TABLE student_messages IS 'Log of messages sent by students';
