import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import ZoneOverlay from './ZoneOverlay';
import ConfirmationDialog from '../shared/ConfirmationDialog';
import { useCamera } from '../../hooks/useCamera';
import { useZoneTracker } from '../../hooks/useZoneTracker';
import { useInventory } from '../../context/InventoryContext';
import { identifyItem } from '../../ai/vision/geminiVision';
import './CameraPanel.css';

const VIDEO_CONSTRAINTS = {
  facingMode: 'environment',
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

export default function CameraPanel({ zones, onReconfigure, highlightedZoneId }) {
  const webcamRef = useRef(null);
  const { addItem } = useInventory();
  
  // State for the AI evaluation flow
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Initialize tracking hooks
  const activeTrackerZoneId = useZoneTracker(webcamRef, zones);

  const handleQualityFrame = useCallback(async (base64Image, metrics) => {
    // Prevent overlapping Gemini calls or running while a dialog is open
    if (isProcessing || pendingItem) return;

    setIsProcessing(true);
    setCapturedImage(base64Image);

    try {
      // 1. Send perfect frame to Gemini
      console.log('Sending optimal frame to Gemini...', metrics);
      const result = await identifyItem(base64Image);
      
      // 2. Open confirmation flow with AI result + Inferred Location
      console.log('Gemini Result:', result);
      setPendingItem({
        ...result,
        zone_id: activeTrackerZoneId // Whatever zone they were standing near when frame passed
      });

    } catch (err) {
      console.error(err);
      alert(err.message); // In a real app we'd use a toast notification
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, pendingItem, activeTrackerZoneId]);

  // Hook handles requestAnimationFrame evaluation and fires handleQualityFrame automatically
  const { frameMetrics, stats } = useCamera(webcamRef, handleQualityFrame);

  // Derive the zone name for the confirmation dialog
  const activeZoneName = zones.find(z => z.id === pendingItem?.zone_id)?.name || 'Unknown Zone';

  const handleConfirm = (confirmedData) => {
    // Log horizontally to the mock database
    addItem(confirmedData);
    setPendingItem(null);
    setCapturedImage(null);
  };

  const handleCorrect = () => {
    // Voice prompt placeholder (simplified for prototype)
    const correctedName = prompt("What is this item really? (e.g. Red Drill)", pendingItem.name);
    if (correctedName) {
      handleConfirm({ ...pendingItem, name: correctedName });
    }
  };

  // Status computation for UI badge
  let statusMode = 'sleeping';
  let statusText = 'Sleeping';
  if (isProcessing) {
    statusMode = 'identifying';
    statusText = 'Identifying Item...';
  } else if (pendingItem) {
    statusMode = 'confirming';
    statusText = 'Awaiting Confirmation';
  } else if (frameMetrics && frameMetrics.blurScore < 15) {
    statusMode = 'listening'; // Motion stopped, watching frame quality
    statusText = 'Evaluating Frame...';
  }

  return (
    <section className="camera-panel">
      {/* ── Top Bar ── */}
      <header className="camera-header">
        <div className="header-brand">
          <span className="logo-box">📦</span>
          <h1>TrackHive</h1>
        </div>
        
        <div className="header-status">
          <div className={`status-badge ${statusMode}`}>
            <span className="dot"></span>
            {statusText}
          </div>
          <button className="reconfig-btn" onClick={onReconfigure}>
            ⚙️ Setup
          </button>
        </div>
      </header>

      {/* ── Live Feed ── */}
      <div className="camera-feed-container">
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={VIDEO_CONSTRAINTS}
          className="main-video"
          mirrored={false}
        />
        <ZoneOverlay 
          zones={zones} 
          highlightedZoneId={highlightedZoneId || activeTrackerZoneId} 
        />
      </div>

      {/* ── Token Efficiency Counter (Live from Hook) ── */}
      <div className="token-counter-overlay">
        <div className="counter-item">
          <span className="counter-label">Frames Evaluated</span>
          <span className="counter-value">{stats.evaluated.toLocaleString()}</span>
        </div>
        <div className="counter-divider" />
        <div className="counter-item">
          <span className="counter-label">Sent to AI</span>
          <span className="counter-value highlight">{stats.sent}</span>
        </div>
        <div className="counter-divider" />
        <div className="counter-item">
          <span className="counter-label">Tokens Used</span>
          <span className="counter-value">~{(stats.sent * 258).toLocaleString()}</span>
        </div>
      </div>

      {/* ── Conditional Dialog Overlay ── */}
      {pendingItem && (
        <ConfirmationDialog 
          itemData={pendingItem}
          zoneName={activeZoneName}
          imageSrc={capturedImage}
          onConfirm={handleConfirm}
          onCorrect={handleCorrect}
        />
      )}
    </section>
  );
}
