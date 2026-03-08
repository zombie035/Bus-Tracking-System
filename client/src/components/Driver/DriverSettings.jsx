// client/src/components/Driver/DriverSettings.jsx
import React, { useState, useEffect } from 'react';
import { useDriver } from '../../contexts/DriverContext';
import { busService } from '../../services/busService';

const DriverSettings = ({ compact = false }) => {
  const { settings, updateSettings } = useDriver();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = async (key) => {
    const newSettings = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleChange = async (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    await saveSettings(newSettings);
  };

  const saveSettings = async (newSettings) => {
    setSaving(true);
    const result = await updateSettings(newSettings);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`driver-toggle ${checked ? 'active' : ''}`}
      role="switch"
      aria-checked={checked}
    />
  );

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="driver-setting-item">
          <span className="setting-label">Dark Mode</span>
          <Toggle checked={localSettings.darkMode} onChange={() => handleToggle('darkMode')} />
        </div>
        <div className="driver-setting-item">
          <span className="setting-label">Route Lock</span>
          <Toggle checked={localSettings.routeLock} onChange={() => handleToggle('routeLock')} />
        </div>
        <div className="driver-setting-item">
          <span className="setting-label">High Accuracy GPS</span>
          <Toggle checked={localSettings.locationAccuracy === 'high'} onChange={() => handleChange('locationAccuracy', localSettings.locationAccuracy === 'high' ? 'balanced' : 'high')} />
        </div>
      </div>
    );
  }

  return (
    <div className="driver-glass-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="driver-glass-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--driver-text)', margin: 0 }}>Driver Settings</h3>
          <p style={{ color: 'var(--driver-text-muted)', fontSize: '13px', margin: '2px 0 0' }}>Configure your dashboard</p>
        </div>
        {saving && <div className="driver-spinner"></div>}
        {saved && !saving && (
          <span style={{ color: 'var(--driver-success)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className="fas fa-check-circle"></i> Saved
          </span>
        )}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Navigation Settings */}
        <div>
          <div className="driver-section-header">
            <i className="fas fa-route" style={{ color: 'var(--driver-blue)' }}></i>
            <span>Navigation</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="driver-setting-item">
              <div>
                <div className="setting-label">Route Lock</div>
                <div className="setting-desc">Keep map centered on route</div>
              </div>
              <Toggle checked={localSettings.routeLock} onChange={() => handleToggle('routeLock')} />
            </div>

            <div className="driver-setting-item">
              <div>
                <div className="setting-label">Highway Only</div>
                <div className="setting-desc">Route through highways only</div>
              </div>
              <Toggle checked={localSettings.highwayOnly} onChange={() => handleToggle('highwayOnly')} />
            </div>

            <div className="driver-setting-item">
              <div>
                <div className="setting-label">Traffic Overlay</div>
                <div className="setting-desc">Show traffic information on map</div>
              </div>
              <Toggle checked={localSettings.trafficOverlay} onChange={() => handleToggle('trafficOverlay')} />
            </div>
          </div>
        </div>

        {/* Stop Settings */}
        <div>
          <div className="driver-section-header">
            <i className="fas fa-map-pin" style={{ color: 'var(--driver-green)' }}></i>
            <span>Stop Management</span>
          </div>
          <div className="driver-setting-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div className="setting-label">Auto-mark Stop Distance</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--driver-green)' }}>{localSettings.autoMarkStopDistance}m</div>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="10"
              value={localSettings.autoMarkStopDistance}
              onChange={(e) => handleChange('autoMarkStopDistance', parseInt(e.target.value))}
              className="driver-range"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--driver-text-muted)' }}>20m</span>
              <span style={{ fontSize: '11px', color: 'var(--driver-text-muted)' }}>200m</span>
            </div>
          </div>
        </div>

        {/* GPS Settings */}
        <div>
          <div className="driver-section-header">
            <i className="fas fa-satellite-dish" style={{ color: 'var(--driver-purple)' }}></i>
            <span>GPS & Location</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="driver-setting-item">
              <div>
                <div className="setting-label">High Accuracy Mode</div>
                <div className="setting-desc">Use GPS for precise location</div>
              </div>
              <Toggle
                checked={localSettings.locationAccuracy === 'high'}
                onChange={() => handleChange('locationAccuracy', localSettings.locationAccuracy === 'high' ? 'balanced' : 'high')}
              />
            </div>

            <div className="driver-setting-item">
              <div>
                <div className="setting-label">Data Saver</div>
                <div className="setting-desc">Reduce background updates</div>
              </div>
              <Toggle checked={localSettings.dataSaver} onChange={() => handleToggle('dataSaver')} />
            </div>
          </div>
        </div>

        {/* Layout & Navigation Customization */}
        <div className="driver-settings-section">
          <div className="driver-section-header">
            <i className="fas fa-layer-group" style={{ color: 'var(--driver-purple)' }}></i>
            <span>Layout & Navigation</span>
          </div>

          <div className="settings-controls-grid">
            {/* Navbar Position */}
            <div className="driver-setting-item vertical">
              <div className="setting-label">Navbar Position</div>
              <div className="settings-option-grid">
                {['bottom', 'top', 'floating', 'sidebar'].map(pos => (
                  <button
                    key={pos}
                    className={`driver-btn ${localSettings.layoutConfig?.navbarPosition === pos ? 'driver-btn-primary' : 'driver-btn-ghost'}`}
                    onClick={() => handleChange('layoutConfig', { ...localSettings.layoutConfig, navbarPosition: pos })}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Nav Style */}
            <div className="driver-setting-item vertical">
              <div className="setting-label">Navigation Style</div>
              <div className="settings-option-grid">
                {[
                  { id: 'icons-labels', label: 'Icons + Labels' },
                  { id: 'icons', label: 'Icons Only' },
                  { id: 'compact', label: 'Compact' },
                  { id: 'large', label: 'Large Touch' }
                ].map(style => (
                  <button
                    key={style.id}
                    className={`driver-btn ${localSettings.layoutConfig?.navStyle === style.id ? 'driver-btn-primary' : 'driver-btn-ghost'}`}
                    onClick={() => handleChange('layoutConfig', { ...localSettings.layoutConfig, navStyle: style.id })}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Density */}
            <div className="driver-setting-item vertical">
              <div className="setting-label">Layout Density</div>
              <div className="settings-option-flex">
                {['compact', 'comfortable', 'large'].map(d => (
                  <button
                    key={d}
                    className={`driver-btn ${localSettings.layoutConfig?.density === d ? 'driver-btn-primary' : 'driver-btn-ghost'}`}
                    onClick={() => handleChange('layoutConfig', { ...localSettings.layoutConfig, density: d })}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Control Positioning */}
            <div className="driver-setting-item vertical">
              <div className="setting-label">Map Controls</div>
              <div className="settings-option-flex">
                {['left', 'right'].map(pos => (
                  <button
                    key={pos}
                    className={`driver-btn ${localSettings.layoutConfig?.mapControls === pos ? 'driver-btn-primary' : 'driver-btn-ghost'}`}
                    onClick={() => handleChange('layoutConfig', { ...localSettings.layoutConfig, mapControls: pos })}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              <div className="setting-toggle-row">
                <span className="setting-sublabel">Show Zoom Controls</span>
                <Toggle
                  checked={localSettings.layoutConfig?.showZoom !== false}
                  onChange={() => handleChange('layoutConfig', { ...localSettings.layoutConfig, showZoom: localSettings.layoutConfig?.showZoom === false })}
                />
              </div>
            </div>

            {/* Trip Control Positioning */}
            <div className="driver-setting-item vertical">
              <div className="setting-label">Trip Controls</div>
              <div className="settings-option-flex">
                {[
                  { id: 'inside', label: 'Inside Panel' },
                  { id: 'floating', label: 'Floating' }
                ].map(pos => (
                  <button
                    key={pos.id}
                    className={`driver-btn ${localSettings.layoutConfig?.tripControls === pos.id ? 'driver-btn-primary' : 'driver-btn-ghost'}`}
                    onClick={() => handleChange('layoutConfig', { ...localSettings.layoutConfig, tripControls: pos.id })}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Sheet Behavior */}
            <div className="driver-setting-item vertical">
              <div className="setting-label">Bottom Sheet (Trip Panel)</div>
              <div className="settings-option-flex">
                {[
                  { id: 'collapsed', label: 'Collapsed' },
                  { id: 'expanded', label: 'Expanded' }
                ].map(state => (
                  <button
                    key={state.id}
                    className={`driver-btn ${localSettings.layoutConfig?.bottomSheetDefault === state.id ? 'driver-btn-primary' : 'driver-btn-ghost'}`}
                    onClick={() => handleChange('layoutConfig', { ...localSettings.layoutConfig, bottomSheetDefault: state.id })}
                  >
                    {state.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Position */}
            <div className="driver-setting-item vertical">
              <div className="setting-label">Emergency Button</div>
              <div className="settings-option-grid">
                {[
                  { id: 'top-right', label: 'Top Right' },
                  { id: 'floating-bottom', label: 'Floating Bottom' },
                  { id: 'fixed-bottom', label: 'Fixed in Nav' }
                ].map(pos => (
                  <button
                    key={pos.id}
                    className={`driver-btn ${localSettings.layoutConfig?.emergencyPosition === pos.id ? 'driver-btn-primary' : 'driver-btn-ghost'}`}
                    onClick={() => handleChange('layoutConfig', { ...localSettings.layoutConfig, emergencyPosition: pos.id })}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme & Visibility */}
            <div className="driver-setting-item vertical">
              <div className="setting-label">Theme & Visibility</div>
              <div className="settings-option-grid">
                {[
                  { id: 'light', label: 'Light' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'auto', label: 'Auto' },
                  { id: 'high-contrast', label: 'High Contrast' }
                ].map(t => (
                  <button
                    key={t.id}
                    className={`driver-btn ${localSettings.layoutConfig?.theme === t.id ? 'driver-btn-primary' : 'driver-btn-ghost'}`}
                    onClick={() => handleChange('layoutConfig', { ...localSettings.layoutConfig, theme: t.id })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Display Settings (Legacy) */}
        <div className="driver-settings-section">
          <div className="driver-section-header">
            <i className="fas fa-palette" style={{ color: 'var(--driver-orange)' }}></i>
            <span>Other Settings</span>
          </div>
          <div className="driver-setting-item">
            <div>
              <div className="setting-label">Language</div>
              <div className="setting-desc">Preferred language</div>
            </div>
            <select
              value={localSettings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="driver-btn driver-btn-ghost"
              style={{ padding: '8px', border: '1px solid var(--driver-border)', width: 'auto' }}
            >
              <option value="en">English (EN)</option>
              <option value="hi">Hindi (HI)</option>
              <option value="ta">Tamil (TA)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverSettings;
