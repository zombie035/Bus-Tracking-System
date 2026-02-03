require('dotenv').config({ path: './server/.env' });
const { pool } = require('./server/config/db');

async function checkDatabase() {
    try {
        console.log('Checking database connection...');
        const result = await pool.query('SELECT NOW()');
        console.log('Database connected:', result.rows[0]);

        console.log('Checking notifications table...');
        const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
    `);

        if (tableCheck.rows.length === 0) {
            console.log('❌ Notifications table DOES NOT exist!');
        } else {
            console.log('✅ Notifications table exists with columns:');
            tableCheck.rows.forEach(row => {
                console.log(` - ${row.column_name} (${row.data_type})`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Database check failed:', error);
        process.exit(1);
    }
}

checkDatabase();
