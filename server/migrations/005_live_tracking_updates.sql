-- Migration: Advanced Live Tracking Enhancements
-- File: 005_live_tracking_updates.sql
-- Description: Adds columns for engine status, direction, and idle tracking

-- Add new telemetry columns to buses table
ALTER TABLE buses 
  ADD COLUMN IF NOT EXISTS engine_status VARCHAR(10) DEFAULT 'OFF', -- 'ON' or 'OFF'
  ADD COLUMN IF NOT EXISTS direction DECIMAL(5, 2) DEFAULT 0.00, -- Heading in degrees (0-360)
  ADD COLUMN IF NOT EXISTS idle_start_time TIMESTAMP;

-- Create index for performance on status queries
CREATE INDEX IF NOT EXISTS idx_buses_engine ON buses(engine_status);

-- Comments for documentation
COMMENT ON COLUMN buses.engine_status IS 'Current ignition status of the bus (ON/OFF)';
COMMENT ON COLUMN buses.direction IS 'Heading direction in degrees (0-360)';
COMMENT ON COLUMN buses.idle_start_time IS 'Timestamp when the bus started idling (speed = 0 while engine ON)';
