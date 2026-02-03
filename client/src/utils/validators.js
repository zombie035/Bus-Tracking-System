// Validation utilities for user data

export const userValidators = {
  name: (value) => {
    if (!value || value.trim().length === 0) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (value.trim().length > 50) {
      return 'Name must be less than 50 characters';
    }
    return null;
  },

  email: (value, row, allData) => {
    if (!value || value.trim().length === 0) {
      return 'Email is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return 'Invalid email format';
    }

    // Check for duplicates in current data
    const currentIndex = allData.indexOf(row);
    const duplicate = allData.find((r, index) =>
      index !== currentIndex && r.email?.toLowerCase() === value.toLowerCase()
    );
    if (duplicate) {
      return 'Email already exists';
    }

    return null;
  },

  role: (value) => {
    const validRoles = ['admin', 'driver', 'student'];
    if (!value || !validRoles.includes(value.toLowerCase())) {
      return 'Role must be admin, driver, or student';
    }
    return null;
  },

  phone: (value) => {
    if (!value || value.trim().length === 0) {
      return null; // Phone is optional
    }

    // Remove all non-digit characters for validation
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    if (digitsOnly.length > 15) {
      return 'Phone number must be less than 15 digits';
    }

    return null;
  },

  studentId: (value, row, allData) => {
    if (row.role !== 'student') {
      return null; // Only required for students
    }

    if (!value || value.trim().length === 0) {
      return 'Student ID is required for students';
    }

    // Check for duplicates in current data
    const currentIndex = allData.indexOf(row);
    const duplicate = allData.find((r, index) =>
      index !== currentIndex && r.studentId === value.trim()
    );
    if (duplicate) {
      return 'Student ID already exists';
    }

    return null;
  },

  address: (value) => {
    if (value && value.trim().length > 200) {
      return 'Address must be less than 200 characters';
    }
    return null;
  }
};

// General validation function
export const validateField = (fieldName, value, row = {}, allData = []) => {
  const validator = userValidators[fieldName];
  if (!validator) return null;

  return validator(value, row, allData);
};

// Validate entire row
export const validateRow = (row, allData = []) => {
  const errors = {};
  Object.keys(userValidators).forEach(field => {
    const error = validateField(field, row[field], row, allData);
    if (error) {
      errors[field] = error;
    }
  });
  return errors;
};

// Validate entire dataset
export const validateData = (data) => {
  const errors = {};
  data.forEach((row, index) => {
    const rowErrors = validateRow(row, data);
    if (Object.keys(rowErrors).length > 0) {
      errors[index] = rowErrors;
    }
  });
  return errors;
};
