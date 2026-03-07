import { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import './InventoryPanel.css';

export default function InventoryPanel({ zones }) {
  const { items, events, removeItem } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState('all');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Status Check (only show items currently "IN" the inventory)
      if (item.status !== 'in') return false;

      // 2. Zone Filter
      if (filterZone !== 'all' && item.zone_id !== filterZone) return false;

      // 3. Search Query Check
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const inName = item.name.toLowerCase().includes(query);
        const inType = item.item_type.toLowerCase().includes(query);
        
        let inFeatures = false;
        if (item.distinguishing_features) {
          inFeatures = Object.values(item.distinguishing_features)
            .some(val => String(val).toLowerCase().includes(query));
        }
        
        return inName || inType || inFeatures;
      }

      return true;
    });
  }, [items, searchQuery, filterZone]);

  const getZoneName = (id) => zones.find(z => z.id === id)?.name || 'Unknown Zone';

  return (
    <aside className="inventory-panel">
      <header className="inventory-header">
        <h2>Inventory ({filteredItems.length})</h2>
        <div className="inventory-controls">
          <input 
            type="text" 
            placeholder="Search name, type, or color..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="zone-filter"
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
          >
            <option value="all">All Zones</option>
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
      </header>
      
      <div className="inventory-content">
        {items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🗂️</span>
            <h3>No items tracked yet</h3>
            <p>Wave at the camera and hold up an item to get started.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>No items match your search/filter.</p>
          </div>
        ) : (
          <div className="items-list">
            {filteredItems.map(item => (
              <div key={item.id} className="item-card glass">
                <div className="item-card-header">
                  <h4>{item.name}</h4>
                  <button 
                    className="remove-btn" 
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                  >
                    Take Out
                  </button>
                </div>
                
                <div className="item-meta">
                  <span className="badge type-badge">{item.item_type}</span>
                  <span className="badge zone-badge">📍 {getZoneName(item.zone_id)}</span>
                </div>

                {item.distinguishing_features && Object.keys(item.distinguishing_features).length > 0 && (
                  <div className="item-features">
                    {Object.entries(item.distinguishing_features).map(([key, val]) => (
                      <span key={key} className="feature-pill">{val}</span>
                    ))}
                  </div>
                )}
                
                <div className="item-footer">
                  <small>Added: {new Date(item.added_at).toLocaleTimeString()}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
