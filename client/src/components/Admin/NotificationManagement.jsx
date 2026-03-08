// client/src/components/Admin/NotificationManagement.jsx
import React, { useState, useEffect } from 'react';
import {
    PaperAirplaneIcon,
    BellAlertIcon,
    ClockIcon,
    UserGroupIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const NotificationManagement = () => {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        read: 0,
        unread: 0
    });

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        recipientType: 'all', // all, student, driver
        notificationType: 'info', // info, warning, alert, success
        expiresIn: 24 // hours
    });

    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null

    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchHistory();
        fetchStats();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/api/admin/notifications/history');
            if (response.data.success) {
                setHistory(response.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/notifications/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;

        // Client-side validation to match server rules
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/zip',
            'application/x-zip-compressed'
        ];

        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(selectedFile.type)) {
            setToast({
                type: 'error',
                message: 'Unsupported file type. Only PDF, DOCX, PPT, images, and ZIP are allowed.'
            });
            setFile(null);
            return;
        }

        if (selectedFile.size > maxSize) {
            setToast({
                type: 'error',
                message: 'File is too large. Maximum size is 10MB.'
            });
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setUploadProgress(0);
        setUploadStatus(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUploadProgress(0);
        setUploadStatus(null);

        try {
            // Calculate expiration date
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + parseInt(formData.expiresIn));

            // FormData for file upload
            const data = new FormData();
            data.append('title', formData.title);
            data.append('message', formData.message);
            data.append('recipientType', formData.recipientType);
            data.append('notificationType', formData.notificationType);
            data.append('expiresAt', expiresAt.toISOString());
            if (file) {
                data.append('file', file);
            }

            const response = await api.post('/api/admin/notifications/broadcast', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (event) => {
                    if (!event.total) return;
                    const percent = Math.round((event.loaded * 100) / event.total);
                    setUploadProgress(percent);
                }
            });

            if (response.data.success) {
                setToast({ type: 'success', message: 'Notification broadcasted successfully!' });
                setFormData({
                    title: '',
                    message: '',
                    recipientType: 'all',
                    notificationType: 'info',
                    expiresIn: 24
                });
                setFile(null); // Reset file
                setUploadStatus('success');
                setUploadProgress(0);
                fetchHistory(); // Refresh history
                fetchStats(); // Refresh stats
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            const message =
                error.response?.data?.message ||
                error.message ||
                'Failed to send notification';
            setToast({ type: 'error', message });
            setUploadStatus('error');
        } finally {
            setLoading(false);
            // Clear toast after 3 seconds
            setTimeout(() => setToast(null), 3000);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-100 text-green-800';
            case 'warning': return 'bg-amber-100 text-amber-800';
            case 'alert':
            case 'error': return 'bg-red-100 text-red-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                    } z-50 transition-opacity duration-300`}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Notification Management</h2>
                    <p className="text-gray-600">Broadcast messages and manage system alerts</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <BellAlertIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Sent (30d)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <UserGroupIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Read Rate</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0}%
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <ClockIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Alerts</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {history.filter(n => !n.expires_at || new Date(n.expires_at) > new Date()).length}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Notification Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <PaperAirplaneIcon className="w-5 h-5 text-blue-600" />
                            Send Broadcast
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., School Closed Tomorrow"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    required
                                    rows="4"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your message here..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                                    <select
                                        value={formData.recipientType}
                                        onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">Check Everyone</option>
                                        <option value="student">Students Only</option>
                                        <option value="driver">Drivers Only</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.notificationType}
                                        onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="alert">Critical Alert</option>
                                        <option value="success">Success</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                <select
                                    value={formData.expiresIn}
                                    onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="1">1 Hour</option>
                                    <option value="12">12 Hours</option>
                                    <option value="24">24 Hours</option>
                                    <option value="48">48 Hours</option>
                                    <option value="168">7 Days</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                                <div
                                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors relative ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                            handleFileSelect(e.dataTransfer.files[0]);
                                        }
                                    }}
                                >
                                    <div className="space-y-2 text-center">
                                        {!file ? (
                                            <>
                                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                <div className="flex text-sm text-gray-600 justify-center">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                        <span>Browse file</span>
                                                        <input
                                                            id="file-upload"
                                                            name="file-upload"
                                                            type="file"
                                                            className="sr-only"
                                                            onChange={handleFileChange}
                                                        />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">PDF, DOCX, PPT, images, ZIP up to 10MB</p>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded-full max-w-full">
                                                    <span className="font-semibold truncate max-w-[160px]" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                    <span className="text-gray-500 text-xs">
                                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                    <span className="text-gray-400 text-xs uppercase">
                                                        {file.type || 'Unknown type'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFile(null)}
                                                        className="text-red-500 hover:text-red-700 ml-1"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-green-600 font-medium">
                                                    {uploadStatus === 'success'
                                                        ? 'Uploaded successfully'
                                                        : uploadStatus === 'error'
                                                            ? 'Upload failed. Please try again.'
                                                            : 'Ready to upload'}
                                                </p>
                                                {uploadProgress > 0 && uploadProgress < 100 && (
                                                    <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className="h-full bg-blue-500 transition-all"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? 'Sending...' : (
                                    <>
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                        Broadcast Notification
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Recent Broadcasts</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                                    <tr>
                                        <th className="px-6 py-4">Title / Message</th>
                                        <th className="px-6 py-4">Target</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Sent At</th>
                                        <th className="px-6 py-4">Attachment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                                                No notifications sent yet
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                                                        {item.title}
                                                        {item.attachment_url && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold border border-blue-100">
                                                                <i className="fas fa-paperclip" />
                                                                File
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="truncate max-w-xs">{item.message}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">
                                                        {item.recipient_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getTypeColor(item.notification_type)}`}>
                                                        {item.notification_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.attachment_url ? (
                                                        <a
                                                            href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${item.attachment_url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 border border-gray-200"
                                                        >
                                                            <i className="fas fa-download" />
                                                            <span className="truncate max-w-[120px]">
                                                                {item.attachment_name || 'Download'}
                                                            </span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationManagement;
