
// PostgreSQL connection using 'pg' package
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://app_user:strongpassword@localhost:5432/bus_tracking',
});

let isConnected = false;

const connectDB = async () => {
  try {
    // Test the connection
    const result = await pool.query('SELECT NOW()');
    isConnected = true;
    console.log('✅ Connected to PostgreSQL database at:', result.rows[0].now);
  } catch (error) {
    isConnected = false;
    console.error('❌ PostgreSQL Connection Error:', error.message);
    // Try to connect again in 3 seconds
    setTimeout(connectDB, 3000);
  }
};

module.exports = connectDB;
module.exports.pool = pool;
module.exports.isConnected = () => isConnected;

