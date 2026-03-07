import { useState } from 'react';
import { ZoneType } from '../../types';
import './ZoneForm.css';

export default function ZoneForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(ZoneType.SHELF);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), type });
  };

  return (
    <div className="zone-form-overlay">
      <div className="zone-form-card glass">
        <h3>Save Zone</h3>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label htmlFor="zoneName">Zone Name</label>
            <input
              id="zoneName"
              type="text"
              autoFocus
              placeholder="e.g. Shelf 1, Top Drawer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="zoneType">Type</label>
            <select
              id="zoneType"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {Object.values(ZoneType).map(t => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={!name.trim()}>
              Save Zone
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
