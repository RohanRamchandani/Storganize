import { createContext, useContext, useState, useEffect } from 'react';
import { ItemStatus, EventAction } from '../types';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('th_items');
    const savedEvents = localStorage.getItem('th_events');
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedEvents) setEvents(JSON.parse(savedEvents));
  }, []);

  // Save on every change
  useEffect(() => {
    localStorage.setItem('th_items', JSON.stringify(items));
    localStorage.setItem('th_events', JSON.stringify(events));
  }, [items, events]);

  const addItem = (itemData) => {
    const newItem = {
      id: crypto.randomUUID(),
      ...itemData,
      status: ItemStatus.IN,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);

    const newEvent = {
      id: crypto.randomUUID(),
      item_id: newItem.id,
      action: EventAction.ADDED,
      before: null,
      after: newItem,
      timestamp: new Date().toISOString(),
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const updateItem = (id, updates) => {
    let beforeState = null;
    let afterState = null;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          beforeState = { ...item };
          afterState = { ...item, ...updates, updated_at: new Date().toISOString() };
          return afterState;
        }
        return item;
      })
    );

    if (beforeState && afterState) {
      const newEvent = {
        id: crypto.randomUUID(),
        item_id: id,
        action: EventAction.CORRECTED,
        before: beforeState,
        after: afterState,
        timestamp: new Date().toISOString(),
      };
      setEvents((prev) => [newEvent, ...prev]);
    }
  };

  const removeItem = (id) => {
    updateItem(id, { status: ItemStatus.OUT });
    // Note: A more complex system would fire EventAction.REMOVED instead of CORRECTED
  };

  return (
    <InventoryContext.Provider value={{ items, events, addItem, updateItem, removeItem }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
