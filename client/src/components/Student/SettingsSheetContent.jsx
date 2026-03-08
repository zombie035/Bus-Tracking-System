// client/src/components/Student/SettingsSheetContent.jsx
import React from 'react';
import {
    MapIcon,
    GlobeAltIcon,
    MoonIcon,
    SunIcon,
    QuestionMarkCircleIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const SettingsSheetContent = ({ mapTheme, onMapThemeChange, onLogout, onChangeSheet }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-xl font-bold text-black">Settings</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Map Theme Selection */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Map Style</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'default', label: 'Default', icon: GlobeAltIcon },
                            { id: 'satellite', label: 'Satellite', icon: MoonIcon },
                            { id: 'dark', label: 'Dark', icon: MoonIcon },
                            { id: 'light', label: 'Light', icon: SunIcon }
                        ].map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => onMapThemeChange(theme.id)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mapTheme === theme.id
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <theme.icon className="w-4 h-4" />
                                {theme.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Help Section */}
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Support</h3>
                    <div className="space-y-2">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <QuestionMarkCircleIcon className="w-5 h-5 text-gray-600" />
                                <h4 className="font-bold text-sm text-gray-900">Need Help?</h4>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">Report issues with the bus, driver, or app.</p>
                            <button
                                onClick={() => onChangeSheet('feedback')}
                                className="w-full py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                REPORT AN ISSUE
                            </button>
                        </div>

                        <div className="text-xs text-gray-500 space-y-1 p-3">
                            <p className="font-bold text-gray-700 mb-1">Quick Tips:</p>
                            <p>• Swipe up from bottom to see route details</p>
                            <p>• Tap map markers for stop information</p>
                            <p>• Check notifications for updates</p>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="pt-4 border-t border-gray-200">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsSheetContent;
