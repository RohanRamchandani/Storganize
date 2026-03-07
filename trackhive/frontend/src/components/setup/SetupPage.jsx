import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import ZoneDrawingCanvas from './ZoneDrawingCanvas';
import ZoneForm from './ZoneForm';
import './SetupPage.css';

const VIDEO_CONSTRAINTS = {
  facingMode: 'environment',
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

export default function SetupPage({ onSetupComplete }) {
  const webcamRef = useRef(null);
  const [zones, setZones] = useState([]);
  const [pendingRect, setPendingRect] = useState(null); // { x_min, y_min, x_max, y_max }
  const [showForm, setShowForm] = useState(false);

  // Load existing zones from localStorage on mount (if user is returning to edit)
  useEffect(() => {
    const saved = localStorage.getItem('th_zones');
    if (saved) {
      try {
        setZones(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse zones', e);
      }
    }
  }, []);

  const handleDrawComplete = (rect) => {
    setPendingRect(rect);
    setShowForm(true);
  };

  const handleSaveZone = (zoneData) => {
    const newZone = {
      id: crypto.randomUUID(),
      ...zoneData,
      ...pendingRect,
    };
    const updatedZones = [...zones, newZone];
    setZones(updatedZones);
    localStorage.setItem('th_zones', JSON.stringify(updatedZones));
    
    setPendingRect(null);
    setShowForm(false);
  };

  const handleCancelZone = () => {
    setPendingRect(null);
    setShowForm(false);
  };

  const handleDeleteZone = (id) => {
    const updated = zones.filter(z => z.id !== id);
    setZones(updated);
    localStorage.setItem('th_zones', JSON.stringify(updated));
  };

  const handleDone = () => {
    onSetupComplete(zones);
  };

  return (
    <div className="setup-page">
      <div className="setup-camera-view">
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={VIDEO_CONSTRAINTS}
          className="setup-video"
          mirrored={false}
        />
        <ZoneDrawingCanvas
          zones={zones}
          onDrawComplete={handleDrawComplete}
          disabled={showForm} 
        />
        
        {showForm && pendingRect && (
          <ZoneForm
            onSave={handleSaveZone}
            onCancel={handleCancelZone}
          />
        )}
      </div>

      <aside className="setup-sidebar">
        <div className="sidebar-header">
          <span className="logo-icon">📦</span>
          <h2>TrackHive Setup</h2>
        </div>
        
        <div className="sidebar-instructions">
          <h3>Define Storage Zones</h3>
          <p>Click and drag on the camera feed to draw bounding boxes around your shelves, drawers, or bins.</p>
        </div>

        <div className="zones-list">
          <h3>Saved Zones ({zones.length})</h3>
          {zones.length === 0 ? (
            <div className="empty-zones">No zones defined yet.</div>
          ) : (
            <ul>
              {zones.map(z => (
                <li key={z.id} className="zone-list-item">
                  <div className="zone-info">
                    <strong>{z.name}</strong>
                    <span className="zone-type-badge">{z.type}</span>
                  </div>
                  <button 
                    className="delete-zone-btn" 
                    onClick={() => handleDeleteZone(z.id)}
                    title="Delete zone"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button 
          className="done-setup-btn"
          disabled={zones.length === 0}
          onClick={handleDone}
        >
          Done — Start Tracking
        </button>
      </aside>
    </div>
  );
}
