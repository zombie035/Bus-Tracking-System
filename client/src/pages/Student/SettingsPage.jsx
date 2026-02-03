import React, { useState } from 'react';

const SettingsPage = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [mapStyle, setMapStyle] = useState('default');

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                {/* Notification Settings */}
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Push Notifications</p>
                                <p className="text-sm text-gray-500">Receive alerts when bus is near</p>
                            </div>
                            <button
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Email Alerts</p>
                                <p className="text-sm text-gray-500">Receive trip summaries via email</p>
                            </div>
                            <button
                                onClick={() => setEmailAlerts(!emailAlerts)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlerts ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* App Preferences */}
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">App Preferences</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Map Display Style</label>
                            <select
                                value={mapStyle}
                                onChange={(e) => setMapStyle(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                            >
                                <option value="default">Standard</option>
                                <option value="satellite">Satellite</option>
                                <option value="terrain">Terrain</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-b-xl">
                    <p className="text-xs text-gray-500 text-center">App Version 1.0.2</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
