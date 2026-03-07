import { useSettings } from '../../context/SettingsContext';
import { ConfirmMode, WakeTrigger } from '../../types';
import './SettingsPanel.css';

export const settingsConfig = [
  {
    section: 'Wake Trigger',
    items: [
      { key: 'wakeTrigger', label: 'Wake Mode', type: 'select', options: [{val: WakeTrigger.GESTURE, label: 'Gesture (Wave)'}, {val: WakeTrigger.VOICE, label: 'Voice (Hey TrackHive)'}] },
    ]
  },
  {
    section: 'Confirmation',
    items: [
      { key: 'confidenceThreshold', label: 'Confidence Threshold (%)', type: 'slider', min: 0, max: 100 },
      { key: 'highConfirmationMode', label: 'High Confidence Action', type: 'select', options: [{val: ConfirmMode.UI_ONLY, label: 'Auto-log (UI Only)'}, {val: ConfirmMode.VOICE, label: 'Ask for Verbal Confirmation'}] },
      { key: 'lowConfirmationMode', label: 'Low Confidence Action', type: 'select', options: [{val: ConfirmMode.UI_ONLY, label: 'Show Dialog Card'}, {val: ConfirmMode.VOICE, label: 'Ask for Verbal Correction'}] },
    ]
  },
  {
    section: 'Frame Capture',
    items: [
      { key: 'qualityBlurThreshold', label: 'Required Stillness (Blur)', description: 'Lower = item must be held very still', type: 'slider', min: 1, max: 30 },
      { key: 'cooldownMs', label: 'Cooldown between AI calls (ms)', type: 'text' },
    ]
  },
  {
    section: 'Gemini Configuration',
    items: [
      { key: 'agentMode', label: 'AI Terminology', type: 'select', options: [{val: 'warehouse', label: 'Warehouse'}, {val: 'office', label: 'Office'}, {val: 'school', label: 'School'}] },
    ]
  }
];

export default function SettingsPanel({ onClose }) {
  const { settings, updateSetting } = useSettings();

  return (
    <div className="settings-overlay">
      <div className="settings-modal glass">
        <header className="settings-header">
          <h2>TrackHive Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </header>

        <div className="settings-body">
          {settingsConfig.map((group, idx) => (
            <div key={idx} className="settings-section">
              <h3>{group.section}</h3>
              {group.items.map((item) => (
                <div key={item.key} className="setting-row">
                  <div className="setting-info">
                    <label>{item.label}</label>
                    {item.description && <span className="desc">{item.description}</span>}
                  </div>
                  
                  <div className="setting-control">
                    {item.type === 'slider' && (
                      <div className="slider-group">
                        <input 
                          type="range" 
                          min={item.min} 
                          max={item.max} 
                          value={settings[item.key]} 
                          onChange={(e) => updateSetting(item.key, Number(e.target.value))}
                        />
                        <span className="val-readout">{settings[item.key]}</span>
                      </div>
                    )}

                    {item.type === 'select' && (
                      <select 
                        value={settings[item.key]} 
                        onChange={(e) => updateSetting(item.key, e.target.value)}
                      >
                        {item.options.map(opt => (
                          <option key={opt.val} value={opt.val}>{opt.label}</option>
                        ))}
                      </select>
                    )}

                    {item.type === 'text' && (
                      <input 
                        type="text" 
                        value={settings[item.key]} 
                        onChange={(e) => updateSetting(item.key, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
