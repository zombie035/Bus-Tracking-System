// client/src/components/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import UserForm from './UserForm';
import BulkUserUpload from './BulkUserUpload';
import Toast from '../UI/Toast'; // Assuming you have this component
import Modal from '../UI/Modal'; // Assuming you have this component

const UserManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'single', 'bulk', or 'edit'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState({ password: '', confirmPassword: '' });
  const [userToReset, setUserToReset] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      if (response.success) {
        setUsers(response.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToastMsg('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserClick = () => {
    setSelectedUser(null);
    setModalType('single');
    setShowModal(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setModalType('edit');
    setShowModal(true);
  };

  const handleResetClick = (user) => {
    setUserToReset(user);
    setResetData({ password: '', confirmPassword: '' });
    setShowResetPassword(false);
    setResetModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setDeleteConfirm(user);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const userId = deleteConfirm.id || deleteConfirm._id;
      const response = await userService.deleteUser(userId);

      if (response.success || response.message === 'User deleted successfully') {
        showToastMsg('User deleted successfully');
        setDeleteConfirm(null);
        fetchUsers();
      } else {
        showToastMsg(response.message || 'Error deleting user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToastMsg('Failed to delete user', 'error');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType('');
    setSelectedUser(null);
  };

  const handleUserSuccess = () => {
    setShowModal(false);
    setModalType('');
    setSelectedUser(null);
    fetchUsers(); // Refresh the list
    showToastMsg(selectedUser ? 'User updated successfully' : 'User created successfully');
  };

  const handleResetSubmit = async () => {
    if (resetData.password !== resetData.confirmPassword) {
      showToastMsg('Passwords do not match', 'error');
      return;
    }
    if (resetData.password.length < 6) {
      showToastMsg('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const response = await userService.resetPassword(userToReset.id || userToReset._id, resetData.password);
      if (response.success) {
        showToastMsg('Password reset successfully');
        setResetModalOpen(false);
        setUserToReset(null);
      } else {
        showToastMsg(response.message || 'Failed to reset password', 'error');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showToastMsg(error.message || 'Failed to reset password', 'error');
    }
  };

  // Filtering Logic
  const filteredUsers = users.filter(user => {
    // Determine search match (check name, email, and phone)
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(searchLower);
    const emailMatch = user.email?.toLowerCase().includes(searchLower);
    const phoneMatch = user.phone?.includes(searchLower);

    const matchesSearch = nameMatch || emailMatch || phoneMatch;

    // Determine role match
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage students, drivers, and admins</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddUserClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> Add User
          </button>
          <button
            onClick={() => { setModalType('bulk'); setShowModal(true); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-file-upload"></i> Bulk Import
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></i>
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base shadow-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-base shadow-sm min-w-[200px]"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No users found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Info</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id || user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          {user.studentId && (
                            <div className="text-xs text-gray-500">ID: {user.studentId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'driver' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{user.email || '-'}</div>
                      <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.busAssigned ? `Bus ${user.busAssigned}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={() => handleResetClick(user)}
                        className="text-amber-600 hover:text-amber-900 mr-4"
                        title="Reset Password"
                      >
                        <i className="fas fa-key"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Modal (Add/Edit/Bulk) */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={
          modalType === 'bulk' ? 'Bulk Import Users' :
            selectedUser ? 'Edit User' : 'Add New User'
        }
      >
        {modalType === 'bulk' ? (
          <BulkUserUpload onSuccess={handleUserSuccess} onCancel={handleModalClose} />
        ) : (
          <UserForm
            user={selectedUser}
            onSuccess={handleUserSuccess}
            onCancel={handleModalClose}
          />
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Reset Password - ${userToReset?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showResetPassword ? "text" : "password"}
                value={resetData.password}
                onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <i className={`fas ${showResetPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type={showResetPassword ? "text" : "password"}
              value={resetData.confirmPassword}
              onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResetSubmit}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Reset Password
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete User
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;