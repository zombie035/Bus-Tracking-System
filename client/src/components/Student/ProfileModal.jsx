// client/src/components/Student/ProfileModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfileModal = ({ isOpen, onClose, onPasswordChanged }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/student/profile');
            if (response.data.success) {
                setProfile(response.data.profile);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setChangingPassword(true);
            const response = await axios.put('/api/student/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            if (response.data.success) {
                setSuccess('Password updated successfully!');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                if (onPasswordChanged) onPasswordChanged();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setChangingPassword(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        </div>
                    ) : profile ? (
                        <div className="space-y-6">
                            {/* Profile Information */}
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                                        {profile.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{profile.name}</h3>
                                        <p className="text-blue-100">Student ID: {profile.studentId || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Email</p>
                                    <p className="font-medium text-gray-900">{profile.email || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                                    <p className="font-medium text-gray-900">{profile.phone || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Assigned Bus</p>
                                    <p className="font-medium text-gray-900">{profile.busNumber ? `Bus ${profile.busNumber}` : 'Not Assigned'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Route</p>
                                    <p className="font-medium text-gray-900">{profile.routeName || 'N/A'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Boarding Stop</p>
                                    <p className="font-medium text-gray-900">{profile.boardingStop || 'Not Set'}</p>
                                    {profile.boardingStopTime && (
                                        <p className="text-sm text-gray-600">Time: {profile.boardingStopTime}</p>
                                    )}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Dropping Stop</p>
                                    <p className="font-medium text-gray-900">{profile.droppingStop || 'Not Set'}</p>
                                    {profile.droppingStopTime && (
                                        <p className="text-sm text-gray-600">Time: {profile.droppingStopTime}</p>
                                    )}
                                </div>
                            </div>

                            {/* Change Password Section */}
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h4>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                        {success}
                                    </div>
                                )}

                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter new password (min 6 characters)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {changingPassword ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-600 py-8">Failed to load profile</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
