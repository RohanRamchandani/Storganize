import React from 'react';
import './ConfirmationDialog.css';

export default function ConfirmationDialog({ itemData, zoneName, imageSrc, onConfirm, onCorrect }) {
  if (!itemData) return null;

  const { name, item_type, distinguishing_features, confidence } = itemData;
  const features = Object.entries(distinguishing_features || {});

  // Color code the accuracy bar
  let barClass = 'low';
  if (confidence > 80) barClass = 'high';
  else if (confidence > 50) barClass = 'med';

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-card glass">
        <header className="conf-header">
          <h2>Item Logged</h2>
          <p>Please confirm the details below.</p>
        </header>

        <div className="item-preview">
          {imageSrc ? (
            <img src={imageSrc} alt="Captured item" className="item-thumb" />
          ) : (
            <div className="item-thumb placeholder" />
          )}
          
          <div className="item-details">
            <h3>{name}</h3>
            {item_type && <span className="item-type-badge">{item_type}</span>}
            
            {features.length > 0 && (
              <div className="feature-chips">
                {features.map(([key, val]) => (
                  <span key={key} className="chip">{key}: {val}</span>
                ))}
              </div>
            )}
            
            <div className="accuracy-readout" style={{ fontSize: '0.75rem', color: 'var(--th-text-muted)', marginTop: '4px' }}>
              AI Confidence: {confidence}%
              <div className="accuracy-bar">
                <div className={`accuracy-fill ${barClass}`} style={{ width: `${confidence}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="zone-assignment">
          <span className="zone-label">Placed in</span>
          <span className="zone-name">{zoneName || 'Unknown Zone'}</span>
        </div>

        <div className="conf-actions">
          <button className="btn-correct" onClick={onCorrect}>
            Correct
          </button>
          <button className="btn-confirm" onClick={() => onConfirm(itemData)}>
            Confirm 
          </button>
        </div>
      </div>
    </div>
  );
}
