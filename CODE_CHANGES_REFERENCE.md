# Code Changes Reference

## File 1: server/routes/adminRoutes.js

### REMOVED (Duplicate Handler)
```javascript
// ❌ REMOVED - This was duplicated and overriding the correct handler
router.post('/users', async (req, res) => {
  try {
    const result = await adminController.createUser(req, res);
    
    if (result.success) {
      return res.redirect('/admin/users?success=User+created+successfully');
    }
    
    const users = await User.find().select('-password');
    res.render('admin/users', {
      title: 'User Management',
      user: req.session,
      users,
      currentRole: 'all',
      search: '',
      userData: result.formData,
      error: result.message
    });
    
  } catch (error) {
    console.error('Create user route error:', error);
    res.redirect('/admin/users?error=' + encodeURIComponent(error.message));
  }
});
```

### KEPT (Correct Handler)
```javascript
// ✅ KEPT - Clean, JSON-returning handler
router.post('/users', adminController.createUser);
```

---

## File 2: client/src/services/userService.js

### BEFORE
```javascript
// ❌ WRONG ENDPOINTS
api.get('/api/users', { params })
api.post('/api/users', userData)
api.put(`/api/users/${userId}`, userData)
api.delete(`/api/users/${userId}`)
api.post('/api/users/bulk-import', usersData)
api.get('/api/users/drivers/available')
api.get('/api/buses/available')
```

### AFTER
```javascript
// ✅ CORRECT ENDPOINTS (added /admin)
api.get('/api/admin/users', { params })
api.post('/api/admin/users', userData)
api.put(`/api/admin/users/${userId}`, userData)
api.delete(`/api/admin/users/${userId}`)
api.post('/api/admin/users/bulk-import', usersData)
api.get('/api/admin/drivers')
api.get('/api/admin/buses')
```

---

## File 3: server/middleware/authMiddleware.js

### BEFORE
```javascript
// ❌ ALWAYS RETURNED HTML, never JSON
exports.isAdmin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  if (req.session.role !== 'admin') {
    return res.status(403).render('error', {
      message: 'Access Denied',
      error: 'Admin privileges required'
    });
  }
  
  next();
};
```

### AFTER
```javascript
// ✅ RETURNS JSON FOR API REQUESTS, HTML for web
exports.isAdmin = (req, res, next) => {
  if (!req.session.userId) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    return res.redirect('/login');
  }
  
  if (req.session.role !== 'admin') {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ success: false, message: 'Admin privileges required' });
    }
    return res.status(403).render('error', {
      message: 'Access Denied',
      error: 'Admin privileges required'
    });
  }
  
  next();
};
```

---

## File 4: server/controllers/adminController.js

### BEFORE
```javascript
// ❌ MINIMAL LOGGING
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, phone, busNumber } = req.body;
    
    // ... validation code ...
    
    const user = await User.create({ /* ... */ });
    console.log(`✅ User created: ${email} (${user.role})`);
    
    res.status(201).json({ /* ... */ });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ /* ... */ });
  }
};
```

### AFTER
```javascript
// ✅ DETAILED STEP-BY-STEP LOGGING
exports.createUser = async (req, res) => {
  try {
    console.log('🔵 Creating user with data:', req.body);
    const { name, email, password, role, studentId, phone, busNumber } = req.body;
    
    if (!name || !email || !password || !role) {
      console.warn('❌ Validation failed: Missing required fields');
      return res.status(400).json({ /* ... */ });
    }
    
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.warn('❌ User already exists:', email);
      return res.status(400).json({ /* ... */ });
    }
    
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('💾 Creating user in database...');
    const user = await User.create({ /* ... */ });
    
    console.log(`✅ User created successfully: ${email} (${user.role})`);
    res.status(201).json({ /* ... */ });
    
  } catch (error) {
    console.error('❌ Create user error:', error.message, error.stack);
    res.status(500).json({ /* ... */ });
  }
};
```

---

## File 5: server/server.js

### BEFORE
```javascript
// ❌ NO DATABASE INITIALIZATION
const connectDB = require('./config/db');
connectDB();

// ... rest of code ...
```

### AFTER
```javascript
// ✅ ADDED DATABASE INITIALIZATION
const connectDB = require('./config/db');
const initDatabase = require('./utils/initDatabase');

connectDB();

// Initialize database schema
(async () => {
  try {
    await initDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
  }
})();

// ... rest of code ...
```

---

## File 6: server/config/db.js

### BEFORE
```javascript
// ❌ BASIC CONNECTION, NO RETRY
const connectDB = async () => {
  try {
    await pool.connect();
    isConnected = true;
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    isConnected = false;
    console.error('❌ PostgreSQL Connection Error:', error.message);
  }
};
```

### AFTER
```javascript
// ✅ IMPROVED CONNECTION WITH RETRY LOGIC
const connectDB = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    isConnected = true;
    console.log('✅ Connected to PostgreSQL database at:', result.rows[0].now);
  } catch (error) {
    isConnected = false;
    console.error('❌ PostgreSQL Connection Error:', error.message);
    // Retry connection after 3 seconds
    setTimeout(connectDB, 3000);
  }
};
```

---

## File 7: server/utils/initDatabase.js (NEW FILE)

```javascript
// ✅ NEW FILE - Auto-creates database schema
const { pool } = require('../config/db');

const initDatabase = async () => {
  try {
    console.log('📊 Initializing database schema...');

    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        student_id VARCHAR(50),
        phone VARCHAR(20),
        bus_assigned INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(createUsersTable);
    console.log('✅ Users table initialized');

    // Create buses table
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
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(createBusesTable);
    console.log('✅ Buses table initialized');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✅ Database indexes created');

    console.log('✨ Database initialization complete!');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
};

module.exports = initDatabase;
```

---

## Summary of Changes

| Component | Change | Impact |
|-----------|--------|--------|
| Routes | Removed duplicate handler | ✅ Single clear route |
| API Endpoints | Added `/admin` prefix | ✅ Calls correct endpoint |
| Middleware | Added API response format detection | ✅ Returns JSON for API |
| Database Init | Added auto-schema creation | ✅ Tables created automatically |
| Logging | Added detailed step logs | ✅ Easy debugging |
| Connection | Added retry logic | ✅ Better reliability |

All changes work together to fix the user creation flow.
