// server/controllers/authController.js
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Login Controller
exports.login = async (req, res) => {
  try {
    // Accept identifier (email or phone) and password
    const { identifier, email, password } = req.body;
    const loginId = identifier || email; // Support both new and old field names

    console.log('🔐 Login attempt for:', loginId);

    // Validate input
    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and password are required'
      });
    }

    // Determine if loginId is a phone number (digits only) or email
    const isPhone = /^\d+$/.test(loginId);
    let user;

    if (isPhone) {
      // Driver Login
      user = await User.findByPhone(loginId);
    } else {
      // Student/Admin Login
      user = await User.findByEmail(loginId);
    }

    if (!user) {
      console.log('❌ User not found:', loginId);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare passwords

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ Invalid password for:', loginId);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Set session

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.name = user.name;
    req.session.email = user.email;
    req.session.busAssigned = user.bus_assigned || null;

    console.log(`✅ Login successful for ${user.name} (${user.role})`);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.student_id || null,
        phone: user.phone || null,
        busAssigned: user.bus_assigned || null
      }
    });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again.'
    });
  }
};

// Logout Controller
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
};

// Check Authentication Status
exports.checkAuth = (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        name: req.session.name,
        email: req.session.email,
        role: req.session.role
      }
    });
  } else {
    res.json({
      authenticated: false
    });
  }
};

// Register Controller
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, role, studentId } = req.body;

    // Validate role
    if (role && role !== 'student' && role !== 'driver') {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be student or driver.'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    let hashedPassword;
    let finalEmail = email;
    let finalPhone = phone;

    // 🚚 DRIVER REGISTRATION LOGIC
    if (role === 'driver') {
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required for drivers' });
      }
      // Check if phone exists
      const existingPhone = await User.findByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'Phone number already registered' });
      }
      // Password is the phone number
      hashedPassword = await bcrypt.hash(phone, 10);
      finalEmail = null; // Drivers might not have email
    }
    // 🎓 STUDENT REGISTRATION LOGIC
    else {
      if (!email || !password || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
      }
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create new user
    const insertQuery = `
      INSERT INTO users (name, email, password, role, student_id, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role
    `;
    const values = [
      name,
      finalEmail,
      hashedPassword,
      role || 'student', // Default to student
      studentId || null,
      finalPhone || null
    ];

    const result = await pool.query(insertQuery, values);
    const user = result.rows[0];

    console.log(`✅ User registered: ${user.name} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('💥 Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred. Please try again.'
    });
  }
};

// Create test accounts (for development only)
exports.createTestAccounts = async (req, res) => {
  try {
    // Check if test accounts already exist
    const adminExistsResult = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@college.edu']);

    if (adminExistsResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Test accounts already exist'
      });
    }

    const hashedAdminPass = await bcrypt.hash('admin123', 10);
    const hashedDriverPass = await bcrypt.hash('8888888888', 10); // Password = Phone
    const hashedStudentPass = await bcrypt.hash('student123', 10);

    // Create driver account
    await pool.query(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES ($1, $2, $3, $4, $5)
    `, ['John Driver', null, hashedDriverPass, 'driver', '8888888888']);

    // Create student accounts
    await pool.query(`
      INSERT INTO users (name, email, password, role, student_id, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, ['Alice Student', 'student@college.edu', hashedStudentPass, 'student', 'STU001', '7777777777']);

    await pool.query(`
      INSERT INTO users (name, email, password, role, student_id, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, ['Bob Student', 'bob@college.edu', hashedStudentPass, 'student', 'STU002', '7777777778']);

    console.log('✅ Test accounts created successfully');

    res.json({
      success: true,
      message: 'Test accounts created',
      testAccounts: [
        { email: 'admin@college.edu', password: 'admin123', role: 'admin' },
        { phone: '8888888888', password: '8888888888', role: 'driver' },
        { email: 'student@college.edu', password: 'student123', role: 'student' },
        { email: 'bob@college.edu', password: 'student123', role: 'student' }
      ]
    });
  } catch (error) {
    console.error('💥 Error creating test accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test accounts'
    });
  }
};
