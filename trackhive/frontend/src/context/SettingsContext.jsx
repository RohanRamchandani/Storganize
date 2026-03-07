import { createContext, useContext, useState, useEffect } from 'react';
import { WakeTrigger, ConfirmMode } from '../types';

export const defaultSettings = {
  // Wake trigger
  wakeTrigger: WakeTrigger.GESTURE,
  wakeWord: 'hey trackhive',

  // Confirmation behaviour
  confidenceThreshold: 80,
  highConfirmationMode: ConfirmMode.UI_ONLY,
  lowConfirmationMode: ConfirmMode.VOICE,

  // Voice output
  voiceEnabled: true,
  voiceId: 'default',

  // Frame capture thresholds
  motionThreshold: 15,       // % diff to consider "motion present"
  qualityBlurThreshold: 8,   // max frame diff to consider "still enough"
  cooldownMs: 3000,          // min ms between Gemini calls

  // Agent mode
  agentMode: 'warehouse',
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('th_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return defaultSettings;
  });

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('th_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const updateAllSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('th_settings', JSON.stringify(newSettings));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, updateAllSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
