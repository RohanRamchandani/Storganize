import { useState, useEffect } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { InventoryProvider } from './context/InventoryContext';
import SetupPage from './components/setup/SetupPage';
import CameraPanel from './components/camera/CameraPanel';
import InventoryPanel from './components/inventory/InventoryPanel';
import SettingsPanel from './components/settings/SettingsPanel';
import './index.css';

export default function App() {
  const [zones, setZones] = useState([]);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [highlightedZoneId, setHighlightedZoneId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load saved zones on mount
  useEffect(() => {
    const saved = localStorage.getItem('th_zones');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setZones(parsed);
          setIsSetupComplete(true);
        }
      } catch (e) {
        console.error('Failed to parse saved zones', e);
      }
    }
  }, []);

  const handleSetupComplete = (definedZones) => {
    setZones(definedZones);
    setIsSetupComplete(true);
  };

  const handleReconfigure = () => {
    setIsSetupComplete(false);
  };

  return (
    <SettingsProvider>
      <InventoryProvider>
        <div className="app-container">
          <button className="global-settings-toggle" onClick={() => setShowSettings(true)} title="Settings">
            ⚙️
          </button>
          
          {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

          {!isSetupComplete ? (
            <SetupPage onSetupComplete={handleSetupComplete} />
          ) : (
            <main className="main-layout">
              <CameraPanel 
                zones={zones} 
                onReconfigure={handleReconfigure}
                highlightedZoneId={highlightedZoneId} 
              />
              <InventoryPanel zones={zones} />
            </main>
          )}
        </div>
      </InventoryProvider>
    </SettingsProvider>
  );
}
