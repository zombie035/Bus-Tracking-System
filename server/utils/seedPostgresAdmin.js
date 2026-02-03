const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const name = 'Admin User';
  const email = 'admin@college.edu';
  const plainPassword = 'admin123';
  const role = 'admin';

  try {
    // Check if admin already exists
    const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      console.log('✅ Fixed Admin user already exists.');
      return;
    }

    const hash = await bcrypt.hash(plainPassword, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [name, email, hash, role]
    );
    console.log('✅ Fixed Admin user seeded successfully.');
  } catch (err) {
    console.error('Error seeding admin user:', err);
  } finally {
    await pool.end();
  }
}

seedAdmin();