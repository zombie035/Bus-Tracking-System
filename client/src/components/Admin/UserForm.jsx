// client/src/components/Admin/UserForm.jsx
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';

const UserForm = ({ user, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [buses, setBuses] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    phone: '',
    busNumber: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
  if (user) {
    setFormData({
      firstName: user.name ? user.name.split(' ')[0] : '',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      name: user.name || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'student',
      studentId: user.studentId || user.student_id || '',
      phone: user.phone || '',
      busNumber: user.busAssigned?.busNumber || user.bus_assigned || ''
    });
  }
  fetchAvailableBuses();
}, [user]);

  const fetchAvailableBuses = async () => {
    try {
      const response = await userService.getAvailableBuses();
      if (response.success) {
        setBuses(response.buses || []);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    if (formData.role === 'student') {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    }
    
    if (!user && !formData.password) {
      newErrors.password = 'Password is required';
    }
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.role === 'student' && !formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update the handleSubmit function in UserForm.jsx
  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  try {
    // Build user data based on role
    let userData = {
      name: formData.name || `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      role: formData.role,
      phone: formData.phone || ''
    };

    // Add studentId for students
    if (formData.role === 'student') {
      userData.studentId = formData.studentId || '';
    }

    // Only include password if provided (for new users)
    if (!user && formData.password) {
      userData.password = formData.password;
    }

    // Add bus assignment if selected
    if (formData.busNumber) {
      userData.busAssigned = formData.busNumber;
    }

    console.log('📤 Sending user data:', userData);

    let response;
    if (user) {
      const userId = user._id || user.id;
      response = await userService.updateUser(userId, userData);
    } else {
      response = await userService.createUser(userData);
    }

    // Handle response
    if (response.id || response.success !== false) {
      onSuccess();
    } else {
      setErrors({ submit: response.message || 'An error occurred' });
    }
  } catch (error) {
    console.error('Error saving user:', error);
    setErrors({ submit: error.message || 'Failed to save user' });
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <i className="fas fa-exclamation-circle"></i>
            <span>{errors.submit}</span>
          </div>
        </div>
      )}

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role *
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="student">Student</option>
          <option value="driver">Driver</option>
        </select>
      </div>

      {/* Role-based Form Fields */}
      {formData.role === 'driver' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`block w-full px-4 py-3 border ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bus Number (Optional)
            </label>
            <select
        name="busNumber"
        value={formData.busNumber}
        onChange={handleChange}
        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select a bus (optional)</option>
        {buses.map(bus => (
          <option key={bus.id || bus._id || bus.busNumber} value={bus.busNumber}>
            Bus {bus.busNumber} - {bus.routeName || 'No route'}
          </option>
        ))}
      </select>
          </div>
        </div>
      )}

      {formData.role === 'student' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={(e) => {
                  handleChange(e);
                  // Update full name
                  setFormData(prev => ({
                    ...prev,
                    name: `${e.target.value} ${prev.lastName}`.trim()
                  }));
                }}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name (Optional)
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={(e) => {
                  handleChange(e);
                  // Update full name
                  setFormData(prev => ({
                    ...prev,
                    name: `${prev.firstName} ${e.target.value}`.trim()
                  }));
                }}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`block w-full px-4 py-3 border ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="john@college.edu"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Roll No *
            </label>
            <input
              type="text"
              name="studentRollNo"
              value={formData.studentRollNo}
              onChange={(e) => {
                handleChange(e);
                // Update studentId
                setFormData(prev => ({
                  ...prev,
                  studentId: e.target.value
                }));
              }}
              className={`block w-full px-4 py-3 border ${
                errors.studentId ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="STU001"
            />
            {errors.studentId && (
              <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Bus *
            </label>
            <select
  name="busNumber"
  value={formData.busNumber}
  onChange={handleChange}
  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>
  <option value="">Select a bus</option>
  {buses.map(bus => (
    <option key={bus.id || bus._id || bus.busNumber} value={bus.busNumber}>
      Bus {bus.busNumber} - {bus.routeName || 'No route'}
    </option>
  ))}
</select>
          </div>
        </div>
      )}


      {!user && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`block w-full px-4 py-3 border ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`block w-full px-4 py-3 border ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              {user ? 'Update User' : 'Create User'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default UserForm;