// client/src/components/Student/SettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const SettingsPanel = ({ isOpen, onClose, onSaved }) => {
    const [settings, setSettings] = useState({
        theme: 'light',
        language: 'en',
        notificationsEnabled: true,
        busStartedAlert: true,
        busDelayedAlert: true,
        busApproachingAlert: true,
        emergencyAlert: true,
        announcementAlert: true,
        geofenceRadius: 500
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        setLoading(true);
        const result = await busService.getStudentSettings();
        if (result.success && result.settings) {
            setSettings(result.settings);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const result = await busService.updateStudentSettings(settings);
        if (result.success) {
            onSaved?.('Settings saved successfully!');
            onClose();
        } else {
            alert(result.message || 'Failed to save settings');
        }
        setSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <i className="fas fa-cog text-blue-600"></i>
                            Settings
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <i className="fas fa-times text-gray-600"></i>
                        </button>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <i className="fas fa-spinner fa-spin text-3xl text-blue-600 mb-3"></i>
                            <p>Loading settings...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Appearance */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <i className="fas fa-palette text-blue-600"></i>
                                    Appearance
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-gray-700">Theme</label>
                                        <select
                                            value={settings.theme}
                                            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-gray-700">Language</label>
                                        <select
                                            value={settings.language}
                                            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">हिंदी (Hindi)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Notifications */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <i className="fas fa-bell text-blue-600"></i>
                                    Notifications
                                </h3>

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-700 font-medium">Enable All Notifications</span>
                                        <input
                                            type="checkbox"
                                            checked={settings.notificationsEnabled}
                                            onChange={(e) =>
                                                setSettings({ ...settings, notificationsEnabled: e.target.checked })
                                            }
                                            className="w-5 h-5 text-blue-600"
                                        />
                                    </label>

                                    {settings.notificationsEnabled && (
                                        <div className="pl-4 space-y-2 border-l-2 border-gray-200">
                                            <label className="flex items-center justify-between">
                                                <span className="text-gray-700">Bus Started</span>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.busStartedAlert}
                                                    onChange={(e) =>
                                                        setSettings({ ...settings, busStartedAlert: e.target.checked })
                                                    }
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                            </label>

                                            <label className="flex items-center justify-between">
                                                <span className="text-gray-700">Bus Delayed</span>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.busDelayedAlert}
                                                    onChange={(e) =>
                                                        setSettings({ ...settings, busDelayedAlert: e.target.checked })
                                                    }
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                            </label>

                                            <label className="flex items-center justify-between">
                                                <span className="text-gray-700">Bus Approaching</span>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.busApproachingAlert}
                                                    onChange={(e) =>
                                                        setSettings({ ...settings, busApproachingAlert: e.target.checked })
                                                    }
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                            </label>

                                            <label className="flex items-center justify-between">
                                                <span className="text-gray-700">Emergency Alerts</span>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.emergencyAlert}
                                                    onChange={(e) =>
                                                        setSettings({ ...settings, emergencyAlert: e.target.checked })
                                                    }
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                            </label>

                                            <label className="flex items-center justify-between">
                                                <span className="text-gray-700">Announcements</span>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.announcementAlert}
                                                    onChange={(e) =>
                                                        setSettings({ ...settings, announcementAlert: e.target.checked })
                                                    }
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Geofence Radius */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <i className="fas fa-map-marked-alt text-blue-600"></i>
                                    Alert Distance
                                </h3>
                                <div className="space-y-2">
                                    <label className="text-gray-700 text-sm">
                                        Get notified when bus is within: <strong>{settings.geofenceRadius}m</strong>
                                    </label>
                                    <input
                                        type="range"
                                        min="100"
                                        max="2000"
                                        step="100"
                                        value={settings.geofenceRadius}
                                        onChange={(e) =>
                                            setSettings({ ...settings, geofenceRadius: parseInt(e.target.value) })
                                        }
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>100m</span>
                                        <span>2000m</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check mr-2"></i>
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
