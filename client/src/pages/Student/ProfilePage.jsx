import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfilePage = () => {
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
        fetchProfile();
    }, []);

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
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
    if (!profile) return <div className="p-10 text-center text-red-500">Failed to load profile</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Student Profile</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur-sm border-2 border-white/30">
                            {profile.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{profile.name}</h2>
                            <p className="text-blue-100 mt-1">Student ID: {profile.studentId || 'N/A'}</p>
                            <span className="inline-block mt-3 px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                                Class {profile.grade || 'X'} - {profile.section || 'A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Email Address</label>
                            <p className="text-gray-900 font-medium">{profile.email || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                            <p className="text-gray-900 font-medium">{profile.phone || 'N/A'}</p>
                        </div>
                        <div className="col-span-full border-t border-gray-100 my-2"></div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Assigned Bus</label>
                            <div className="flex items-center gap-2">
                                <i className="fas fa-bus text-blue-500"></i>
                                <p className="text-gray-900 font-medium">{profile.busNumber ? `Bus ${profile.busNumber}` : 'Not Assigned'}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Route Name</label>
                            <p className="text-gray-900 font-medium">{profile.routeName || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Boarding Point</label>
                            <p className="text-gray-900 font-medium">{profile.boardingStop || 'Not Set'}</p>
                            {profile.boardingStopTime && <p className="text-xs text-gray-500 mt-0.5">Time: {profile.boardingStopTime}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Dropping Point</label>
                            <p className="text-gray-900 font-medium">{profile.droppingStop || 'Not Set'}</p>
                            {profile.droppingStopTime && <p className="text-xs text-gray-500 mt-0.5">Time: {profile.droppingStopTime}</p>}
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Security Settings</h3>

                        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">{error}</div>}
                        {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">{success}</div>}

                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                    placeholder="Min 6 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={changingPassword}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {changingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
