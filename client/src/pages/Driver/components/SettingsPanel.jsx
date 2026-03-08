import React from 'react';
import {
    SunIcon,
    MoonIcon,
    LockClosedIcon,
    MapIcon,
    EyeIcon
} from '@heroicons/react/24/solid';

const SettingsPanel = ({ settings, onUpdateSettings }) => {

    const handleToggle = (key) => {
        onUpdateSettings({ ...settings, [key]: !settings[key] });
    };

    return (
        <div className="settings-panel glass-panel">
            <h3>DASHBOARD SETTINGS</h3>

            <div className="settings-list">
                {/* Dark Mode Toggle */}
                <div className="setting-item">
                    <div className="setting-info">
                        <div className="setting-icon">
                            {settings.darkMode ? <MoonIcon /> : <SunIcon />}
                        </div>
                        <div className="setting-text">
                            <span className="setting-label">Dark Mode (Control Center)</span>
                            <span className="setting-desc">High contrast dark theme</span>
                        </div>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={settings.darkMode}
                            onChange={() => handleToggle('darkMode')}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                {/* Route Lock */}
                <div className="setting-item">
                    <div className="setting-info">
                        <div className="setting-icon">
                            <LockClosedIcon />
                        </div>
                        <div className="setting-text">
                            <span className="setting-label">Route Lock</span>
                            <span className="setting-desc">Keep bus centered on map</span>
                        </div>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={settings.routeLock}
                            onChange={() => handleToggle('routeLock')}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                {/* Traffic Overlay */}
                <div className="setting-item">
                    <div className="setting-info">
                        <div className="setting-icon">
                            <MapIcon />
                        </div>
                        <div className="setting-text">
                            <span className="setting-label">Traffic Overlay</span>
                            <span className="setting-desc">Show congestion lines</span>
                        </div>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={settings.trafficOverlay}
                            onChange={() => handleToggle('trafficOverlay')}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

                {/* Auto Mark Stop */}
                <div className="setting-item">
                    <div className="setting-info">
                        <div className="setting-icon">
                            <EyeIcon />
                        </div>
                        <div className="setting-text">
                            <span className="setting-label">Auto-Mark Stops</span>
                            <span className="setting-desc">Detect arrival automatically</span>
                        </div>
                    </div>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={settings.autoMarkStop}
                            onChange={() => handleToggle('autoMarkStop')}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>

            </div>
        </div>
    );
};

export default SettingsPanel;
