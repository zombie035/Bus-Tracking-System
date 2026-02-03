// client/src/components/Admin/BulkUserUpload.jsx
import React, { useState, useEffect } from 'react'; // Make sure useState is imported
import { userService } from '../../services/userService';

const BulkUserUpload = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [uploadedUsers, setUploadedUsers] = useState([]);
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file', 'paste', or 'template'
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [fileName, setFileName] = useState('');

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setSuccessMessage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const users = userService.parseCSV(text);
        
        if (users.length === 0) {
          setError('No valid data found in the file');
          return;
        }

        setPreviewData(users);
        setUploadedUsers(users);
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Error parsing file. Please check the format.');
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
    };

    reader.readAsText(file);
  };

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setError('Clipboard is empty');
        return;
      }

      const users = userService.parseClipboard(text);
      if (users.length === 0) {
        setError('No valid data found in clipboard');
        return;
      }

      setPreviewData(users);
      setUploadedUsers(users);
      setError('');
      setSuccessMessage(`Found ${users.length} users in clipboard`);
    } catch (err) {
      console.error('Error reading clipboard:', err);
      setError('Cannot access clipboard. Please paste manually.');
    }
  };

  // Download template
  const downloadTemplate = () => {
    const csvContent = 'name,email,role,student_id,phone,password\n' +
                      'John Doe,john@college.edu,student,STU001,1234567890,password123\n' +
                      'Jane Smith,jane@college.edu,student,STU002,1234567891,password123\n' +
                      'Driver Bob,bob@college.edu,driver,,1234567892,password123\n' +
                      'Admin User,admin@college.edu,admin,,1234567893,password123';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Validate users before import
  const validateUsers = (users) => {
    const errors = [];
    
    users.forEach((user, index) => {
      if (!user.name || !user.name.trim()) {
        errors.push(`Row ${index + 1}: Name is required`);
      }
      if (!user.email || !user.email.trim()) {
        errors.push(`Row ${index + 1}: Email is required`);
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        errors.push(`Row ${index + 1}: Invalid email format`);
      }
      if (!user.role || !['student', 'driver', 'admin'].includes(user.role.toLowerCase())) {
        errors.push(`Row ${index + 1}: Role must be student, driver, or admin`);
      }
      if (user.role?.toLowerCase() === 'student' && !user.student_id) {
        errors.push(`Row ${index + 1}: Student ID is required for students`);
      }
      if (!user.password) {
        errors.push(`Row ${index + 1}: Password is required`);
      }
    });

    return errors;
  };

  // Handle import
  const handleImport = async () => {
    if (uploadedUsers.length === 0) {
      setError('No users to import');
      return;
    }

    const validationErrors = validateUsers(uploadedUsers);
    if (validationErrors.length > 0) {
      setError(`Validation errors:\n${validationErrors.join('\n')}`);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Prepare data for API
      const usersToImport = uploadedUsers.map(user => ({
        name: user.name.trim(),
        email: user.email.trim(),
        role: user.role.toLowerCase(),
        studentId: user.student_id || user.studentId || null,
        phone: user.phone || '',
        password: user.password || 'defaultPassword123',
        status: 'pending'
      }));

      console.log('Importing users:', usersToImport);
      
      const response = await userService.bulkImportUsers({ users: usersToImport });
      
      if (response.success) {
        setSuccessMessage(`Successfully imported ${usersToImport.length} users`);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(response.message || 'Import failed');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  // Render preview table
  const renderPreviewTable = () => {
    if (previewData.length === 0) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Preview ({previewData.length} users)
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.map((user, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'driver'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.student_id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Ready to import
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Import Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Upload a CSV file with columns: name, email, role, student_id, phone, password</li>
          <li>• Roles can be: student, driver, or admin</li>
          <li>• Student ID is required for students only</li>
          <li>• Download the template for the correct format</li>
        </ul>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <i className="fas fa-exclamation-circle"></i>
            <span className="whitespace-pre-line">{error}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <i className="fas fa-check-circle"></i>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Upload Method Selection */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => setUploadMethod('file')}
          className={`px-4 py-2 rounded-lg font-medium ${
            uploadMethod === 'file'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <i className="fas fa-file-upload mr-2"></i>
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setUploadMethod('paste')}
          className={`px-4 py-2 rounded-lg font-medium ${
            uploadMethod === 'paste'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <i className="fas fa-paste mr-2"></i>
          Paste Data
        </button>
        <button
          type="button"
          onClick={downloadTemplate}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
        >
          <i className="fas fa-download mr-2"></i>
          Download Template
        </button>
      </div>

      {/* File Upload Section */}
      {uploadMethod === 'file' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <div className="flex flex-col items-center gap-4">
              <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
              <div>
                <p className="text-gray-600 mb-2">Drag & drop CSV file here, or click to browse</p>
                <p className="text-sm text-gray-500">Supports CSV files only</p>
              </div>
              <label className="cursor-pointer">
                <div className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Browse Files
                </div>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {fileName && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <i className="fas fa-file-csv text-green-600"></i>
                <span className="font-medium">{fileName}</span>
              </div>
              <span className="text-sm text-gray-500">
                {previewData.length} users found
              </span>
            </div>
          )}
        </div>
      )}

      {/* Paste Data Section */}
      {uploadMethod === 'paste' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Paste from Clipboard</h4>
              <button
                type="button"
                onClick={handlePaste}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                <i className="fas fa-paste mr-2"></i>
                Paste Now
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">Supported formats:</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• CSV data: name,email,role,student_id,phone,password</li>
              <li>• Tab-separated values</li>
              <li>• JSON array of user objects</li>
            </ul>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {renderPreviewTable()}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <div className="flex items-center gap-4">
          {previewData.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPreviewData([]);
                setUploadedUsers([]);
                setFileName('');
                setError('');
                setSuccessMessage('');
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear Preview
            </button>
          )}
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || uploadedUsers.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Importing...
              </>
            ) : (
              <>
                <i className="fas fa-cloud-upload-alt"></i>
                Import {uploadedUsers.length} Users
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUserUpload;