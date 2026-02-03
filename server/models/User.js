const { pool } = require('../config/db');
const { mockUserModel } = require('../utils/mockDatabase');

// Check if we should use mock database
const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';

// User model functions for PostgreSQL
class User {
  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by phone
  static async findByPhone(phone) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by phone:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    if (USE_MOCK_DB) {
      return mockUserModel.findById(id);
    }

    try {
      // Ensure id is an integer for PostgreSQL
      const userId = parseInt(id, 10);
      if (isNaN(userId)) {
        return null;
      }
      
      const query = `
        SELECT u.*, b.bus_number, b.route_name
        FROM users u
        LEFT JOIN buses b ON u.bus_assigned = b.id
        WHERE u.id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      const user = result.rows[0];

      if (user && user.bus_assigned) {
        user.busAssigned = {
          id: user.bus_assigned,
          busNumber: user.bus_number,
          routeName: user.route_name
        };
      }

      return user || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    if (USE_MOCK_DB) {
      return mockUserModel.create(userData);
    }

    try {
      const { name, email, password, role = 'student', studentId, phone, busAssigned } = userData;
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, student_id, phone, bus_assigned)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [name, email || null, password, role, studentId || null, phone || null, busAssigned || null]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find all users
  static async find(filter = {}) {
    try {
      let query = 'SELECT * FROM users';
      const values = [];
      const conditions = [];

      if (filter.role) {
        conditions.push(`role = $${values.length + 1}`);
        values.push(filter.role);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error finding users:', error);
      throw error;
    }
  }

  // Update user by ID
  static async findByIdAndUpdate(id, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      });

      values.push(id); // Add ID at the end

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user by ID
  static async findByIdAndDelete(id) {
    if (USE_MOCK_DB) {
      return mockUserModel.findByIdAndDelete(id);
    }

    try {
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

module.exports = User;
