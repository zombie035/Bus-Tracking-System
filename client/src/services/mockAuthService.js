// Mock Authentication Service for Driver Login
const mockDrivers = [
  {
    id: 'driver001',
    name: 'John Smith',
    email: 'john.smith@buscompany.com',
    phone: '+91-9876543210',
    password: 'password123', // In production, this would be hashed
    role: 'driver',
    busNumber: 'BUS001',
    licenseNumber: 'DL123456',
    driverId: 'DRV001',
    isActive: true
  },
  {
    id: 'driver002',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@buscompany.com',
    phone: '+91-9876543211',
    password: 'password123',
    role: 'driver',
    busNumber: 'BUS002',
    licenseNumber: 'DL789012',
    driverId: 'DRV002',
    isActive: true
  },
  {
    id: 'driver003',
    name: 'Michael Chen',
    email: 'michael.chen@buscompany.com',
    phone: '+91-9876543212',
    password: 'password123',
    role: 'driver',
    busNumber: 'BUS003',
    licenseNumber: 'DL345678',
    driverId: 'DRV003',
    isActive: true
  }
];

const mockAdmins = [
  {
    id: 'admin001',
    name: 'Admin User',
    email: 'admin@buscompany.com',
    password: 'admin123',
    role: 'admin',
    isActive: true
  }
];

const mockStudents = [
  {
    id: 'student001',
    name: 'Student User',
    email: 'student@university.com',
    password: 'student123',
    role: 'student',
    isActive: true
  }
];

class MockAuthService {
  // Login with mobile number and password (for drivers)
  async loginWithMobile(phone, password) {
    try {
      console.log('🔍 Looking for driver with phone:', phone);
      console.log('🔍 Available drivers:', mockDrivers.map(d => ({ phone: d.phone, name: d.name })));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Normalize phone number for matching (remove spaces, dashes, etc.)
      const normalizedInput = phone.replace(/[-\s]/g, '');
      
      // Find driver by phone number (flexible matching)
      const driver = mockDrivers.find(d => {
        const normalizedDriverPhone = d.phone.replace(/[-\s]/g, '');
        return normalizedDriverPhone === normalizedInput && d.password === password;
      });
      
      console.log('🔍 Found driver:', driver);
      
      if (driver && driver.isActive) {
        const { password: _, ...userWithoutPassword } = driver;
        console.log('✅ Login successful for:', userWithoutPassword);
        return {
          success: true,
          user: userWithoutPassword,
          token: 'mock-jwt-token-' + driver.id
        };
      }
      
      console.log('❌ Login failed - driver not found or inactive');
      console.log('❌ Tried to match:', normalizedInput);
      console.log('❌ Available phones:', mockDrivers.map(d => d.phone.replace(/[-\s]/g, '')));
      
      return {
        success: false,
        error: 'Invalid phone number or password'
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  // Login with email and password (for admin/student)
  async login(email, password) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check all user types
      let user = null;
      
      // Check admin
      user = mockAdmins.find(u => u.email === email && u.password === password);
      if (user && user.isActive) {
        const { password: _, ...userWithoutPassword } = user;
        return {
          success: true,
          user: userWithoutPassword,
          token: 'mock-jwt-token-' + user.id
        };
      }
      
      // Check student
      user = mockStudents.find(u => u.email === email && u.password === password);
      if (user && user.isActive) {
        const { password: _, ...userWithoutPassword } = user;
        return {
          success: true,
          user: userWithoutPassword,
          token: 'mock-jwt-token-' + user.id
        };
      }
      
      return {
        success: false,
        error: 'Invalid email or password'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  // Get driver by ID
  async getDriverById(driverId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const driver = mockDrivers.find(d => d.id === driverId);
      if (driver) {
        const { password: _, ...userWithoutPassword } = driver;
        return {
          success: true,
          user: userWithoutPassword
        };
      }
      
      return {
        success: false,
        error: 'Driver not found'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch driver data'
      };
    }
  }

  // Get all drivers (for admin)
  async getAllDrivers() {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const driversWithoutPasswords = mockDrivers.map(driver => {
        const { password: _, ...driverWithoutPassword } = driver;
        return driverWithoutPassword;
      });
      
      return {
        success: true,
        drivers: driversWithoutPasswords
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch drivers'
      };
    }
  }

  // Logout
  async logout() {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Logout failed'
      };
    }
  }

  // Validate token (mock implementation)
  async validateToken(token) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (token && token.startsWith('mock-jwt-token-')) {
        const userId = token.replace('mock-jwt-token-', '');
        
        // Find user by ID
        let user = mockDrivers.find(d => d.id === userId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return {
            success: true,
            user: userWithoutPassword
          };
        }
        
        user = mockAdmins.find(a => a.id === userId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return {
            success: true,
            user: userWithoutPassword
          };
        }
        
        user = mockStudents.find(s => s.id === userId);
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return {
            success: true,
            user: userWithoutPassword
          };
        }
      }
      
      return {
        success: false,
        error: 'Invalid token'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Token validation failed'
      };
    }
  }

  // Get mock data for testing
  getMockDrivers() {
    return mockDrivers.map(driver => {
      const { password: _, ...driverWithoutPassword } = driver;
      return driverWithoutPassword;
    });
  }

  getMockAdmins() {
    return mockAdmins.map(admin => {
      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });
  }

  getMockStudents() {
    return mockStudents.map(student => {
      const { password: _, ...studentWithoutPassword } = student;
      return studentWithoutPassword;
    });
  }
}

export default new MockAuthService();
