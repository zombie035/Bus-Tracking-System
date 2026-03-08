// server/utils/initDatabase.js
const { pool } = require('../config/db');

const initDatabase = async () => {
  try {
    console.log('📊 Initializing database schema...');

    // Create users table if it doesn't exist
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        student_id VARCHAR(50),
        phone VARCHAR(20) UNIQUE,
        bus_assigned INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createUsersTable);
    console.log('✅ Users table initialized');

    // MIGRATION: Alter email to be nullable if it isn't already
    try {
      await pool.query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
      console.log('✅ Schema updated: email is now nullable');
    } catch (error) {
      // Ignore if already nullable or other minor errors
    }

    // MIGRATION: Ensure phone is unique
    try {
      await pool.query('ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone)');
      console.log('✅ Schema updated: phone is now unique');
    } catch (error) {
      if (error.code !== '42710') { // 42710 = constraint already exists
        console.log('ℹ️ Phone constraint check:', error.message);
      }
    }

    // Add created_at column if it doesn't exist (for existing tables)
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Added created_at column to users table');
    } catch (error) {
      if (error.code !== '42701') {
        // 42701 = column already exists, which is fine
        throw error;
      }
    }

    // Add updated_at column if it doesn't exist (for existing tables)
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Added updated_at column to users table');
    } catch (error) {
      if (error.code !== '42701') {
        throw error;
      }
    }

    // Create buses table if it doesn't exist
    const createBusesTable = `
      CREATE TABLE IF NOT EXISTS buses (
        id SERIAL PRIMARY KEY,
        bus_number VARCHAR(50) UNIQUE NOT NULL,
        route_name VARCHAR(255),
        capacity INTEGER,
        current_passengers INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'inactive',
        driver_id INTEGER,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        speed DECIMAL(5, 2) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createBusesTable);
    console.log('✅ Buses table initialized');

    // Add created_at column if it doesn't exist (for existing tables)
    try {
      await pool.query(`
        ALTER TABLE buses ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Added created_at column to buses table');
    } catch (error) {
      if (error.code !== '42701') {
        throw error;
      }
    }

    // Add updated_at column if it doesn't exist (for existing tables)
    try {
      await pool.query(`
        ALTER TABLE buses ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Added updated_at column to buses table');
    } catch (error) {
      if (error.code !== '42701') {
        throw error;
      }
    }

    // Add route_stops column if it doesn't exist (for storing route stops as JSON)
    try {
      await pool.query(`
        ALTER TABLE buses ADD COLUMN route_stops TEXT;
      `);
      console.log('✅ Added route_stops column to buses table');
    } catch (error) {
      if (error.code !== '42701') {
        throw error;
      }
    }

    // Add route_description column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE buses ADD COLUMN route_description TEXT;
      `);
      console.log('✅ Added route_description column to buses table');
    } catch (error) {
      if (error.code !== '42701') {
        throw error;
      }
    }

    // Add speed column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE buses ADD COLUMN speed DECIMAL(5, 2) DEFAULT 0;
      `);
      console.log('✅ Added speed column to buses table');
    } catch (error) {
      if (error.code !== '42701') {
        throw error;
      }
    }

    // Create routes table if it doesn't exist
    const createRoutesTable = `
      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        route_name VARCHAR(255) NOT NULL,
        route_number VARCHAR(50) UNIQUE,
        starting_point VARCHAR(255) NOT NULL,
        destination_point VARCHAR(255) NOT NULL,
        stops TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createRoutesTable);
    console.log('✅ Routes table initialized');

    // Create driver_settings table if it doesn't exist
    const createDriverSettingsTable = `
      CREATE TABLE IF NOT EXISTS driver_settings (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        language VARCHAR(10) DEFAULT 'en',
        theme VARCHAR(20) DEFAULT 'auto',
        notifications_enabled BOOLEAN DEFAULT true,
        sound_enabled BOOLEAN DEFAULT true,
        auto_start_tracking BOOLEAN DEFAULT false,
        layout_config JSONB DEFAULT '{
          "navbarPosition": "bottom",
          "navStyle": "icons-label",
          "density": "comfortable",
          "theme": "auto",
          "mapControls": "right",
          "bottomSheetDefault": "collapsed",
          "emergencyPosition": "top-right"
        }',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createDriverSettingsTable);
    console.log('✅ Driver settings table initialized');

    // MIGRATION: Add layout_config if it doesn't exist
    try {
      await pool.query('ALTER TABLE driver_settings ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT \'{"navbarPosition": "bottom", "navStyle": "icons-label", "density": "comfortable", "theme": "auto", "mapControls": "right", "bottomSheetDefault": "collapsed", "emergencyPosition": "top-right"}\'');
      console.log('✅ Migrated driver_settings: layout_config column added');
    } catch (error) {
      console.warn('⚠️ driver_settings migration warning:', error.message);
    }

    // Create an index for faster lookups
    try {
      // Users Performance Indexes
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_users_bus_assigned ON users(bus_assigned);');

      // Buses Performance Indexes
      await pool.query('CREATE INDEX IF NOT EXISTS idx_buses_driver_id ON buses(driver_id);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_buses_status ON buses(status);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_buses_route_name ON buses(route_name);');

      // Routes Performance Indexes
      await pool.query('CREATE INDEX IF NOT EXISTS idx_routes_route_number ON routes(route_number);');

      console.log('✅ Database performance indexes created');
    } catch (error) {
      console.warn('⚠️ Index creation warning:', error.message);
    }

    console.log('✨ Database initialization complete!');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
};

module.exports = initDatabase;
