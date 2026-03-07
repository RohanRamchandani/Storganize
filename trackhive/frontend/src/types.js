/**
 * TrackHive Shared Constants & Types
 * Defined by the initial project architecture.
 */

// Item status
export const ItemStatus = {
  IN: 'in',
  OUT: 'out',
};

// Event actions
export const EventAction = {
  ADDED: 'added',
  REMOVED: 'removed',
  CORRECTED: 'corrected',
};

// Wake trigger modes
export const WakeTrigger = {
  GESTURE: 'gesture',
  VOICE: 'voice',
};

// Confirmation flow modes
export const ConfirmMode = {
  UI_ONLY: 'ui-only',
  VOICE: 'voice',
};

// Available zone types
export const ZoneType = {
  SHELF: 'shelf',
  DRAWER: 'drawer',
  CABINET: 'cabinet',
  BIN: 'bin',
  RACK: 'rack',
  OTHER: 'other',
};
