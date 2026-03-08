/**
 * zoneTracker.js
 * Matches the current hand position and depth against stored zones.
 * Manages the dwell timer that confirms placement after a hold.
 */

import { palmMatchesZoneDepth } from './depthCalibration.js'

export class ZoneTracker {
  /**
   * @param {object} opts
   * @param {boolean} opts.depthGating   Whether depth matching is enabled
   */
  constructor(opts = {}) {
    this.depthGating = opts.depthGating ?? true

    // Public state — read each frame
    this.activeZone    = null  // zone object | null
    this.dwellProgress = 0     // 0.0 – 1.0
    this.dwellComplete = false

    this._dwellZoneId = null
    this._dwellStart  = null
    this._dwellDone   = false
  }

  // ─── Zone matching ─────────────────────────────────────────────────────────
  /**
   * Determine which zone (if any) the hand is currently in.
   * Supports both 2D-only and depth-gated matching.
   *
   * Zone schema expected: { id, x, y, w, h, depthTarget?, depthTolerance? }
   * (x, y, w, h are 0–1 normalised)
   *
   * @param {object}   handState   The .state object from HandTracker
   * @param {object[]} zones
   */
  matchZones(handState, zones) {
    if (!handState.landmarks) {
      this.activeZone = null
      return
    }

    const px = handState.posX
    const py = handState.posY

    this.activeZone = zones.find(zone => {
      const inBounds = px >= zone.x && px <= zone.x + zone.w &&
                       py >= zone.y && py <= zone.y + zone.h
      if (!inBounds) return false
      return palmMatchesZoneDepth(handState.palmSmooth, zone, this.depthGating)
    }) ?? null
  }

  // ─── Dwell timer ───────────────────────────────────────────────────────────
  /**
   * Advance the dwell timer based on the current active zone.
   * Call once per animation frame after matchZones().
   *
   * @param {number} durationMs   How long to hold before confirming
   * @returns {object|null}  The confirmed zone if this tick triggered completion
   */
  tickDwell(durationMs) {
    const az = this.activeZone

    if (!az) {
      if (this._dwellZoneId) {
        this._dwellZoneId  = null
        this._dwellStart   = null
        this.dwellProgress = 0
        this.dwellComplete = false
        this._dwellDone    = false
      }
      return null
    }

    if (az.id !== this._dwellZoneId) {
      this._dwellZoneId  = az.id
      this._dwellStart   = performance.now()
      this.dwellProgress = 0
      this.dwellComplete = false
      this._dwellDone    = false
      return null
    }

    this.dwellProgress = Math.min(
      (performance.now() - this._dwellStart) / durationMs,
      1
    )

    if (this.dwellProgress >= 1 && !this._dwellDone) {
      this._dwellDone    = true
      this.dwellComplete = true
      return az
    }

    return null
  }

  /**
   * Manually reset the dwell timer (e.g. after an item is logged).
   */
  resetDwell() {
    this._dwellZoneId  = null
    this._dwellStart   = null
    this.dwellProgress = 0
    this.dwellComplete = false
    this._dwellDone    = false
  }
}
