import { useState, useRef, useEffect, useCallback } from 'react'
import { useDepth } from '../context/DepthContext'
import { useZones } from '../context/ZonesContext'
import { palmToDepthPosition, median } from '../lib/depthCalibration'
import './ZoneDepthModal.css'

const SAMPLE_DURATION_MS = 1200
const SAMPLE_INTERVAL_MS = 80

/**
 * Per-zone depth capture modal.
 * Opens for a specific zone. User positions hand at zone depth, captures,
 * and the zone's depthTarget is stored.
 */
export default function ZoneDepthModal({ open, zoneId, onClose }) {
    const { handStateRef, calibration } = useDepth()
    const { zones, setZoneDepth } = useZones()

    const zone = zones.find(z => z.id === zoneId) || null

    const [tolerance, setTolerance] = useState(zone?.depthTolerance ?? 20)
    const [sampling, setSampling]   = useState(false)
    const [warn, setWarn]           = useState(false)
    const [pct, setPct]             = useState(0)
    const [captured, setCaptured]   = useState(false)

    const intervalRef  = useRef(null)
    const rafRef       = useRef(null)
    const cursorRef    = useRef(null)
    const rangeRef     = useRef(null)
    const targetRef    = useRef(null)

    // Sync tolerance when zone changes
    useEffect(() => {
        if (zone) setTolerance(zone.depthTolerance ?? 20)
        setCaptured(!!zone?.depthTarget)
    }, [zoneId, zone])

    // Live cursor update via RAF
    useEffect(() => {
        if (!open) return
        let running = true
        const tick = () => {
            if (!running) return
            if (calibration && cursorRef.current) {
                const pos = palmToDepthPosition(handStateRef.current.palmSmooth, calibration) * 100
                cursorRef.current.style.left = `${pos}%`
            }
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        return () => { running = false; cancelAnimationFrame(rafRef.current) }
    }, [open, calibration, handStateRef])

    const updateRangeBar = useCallback((target, tol) => {
        if (!calibration || !rangeRef.current) return
        const lo = Math.max(0, palmToDepthPosition(target - tol, calibration)) * 100
        const hi = Math.min(100, palmToDepthPosition(target + tol, calibration)) * 100
        rangeRef.current.style.left  = `${lo}%`
        rangeRef.current.style.width = `${hi - lo}%`
        if (targetRef.current) {
            targetRef.current.style.left    = `${palmToDepthPosition(target, calibration) * 100}%`
            targetRef.current.style.display = 'block'
        }
    }, [calibration])

    const capture = useCallback(() => {
        const hs  = handStateRef.current
        const handOk = hs.handVisible || hs.gracePeriod
        if (!handOk) { setWarn(true); return }

        setWarn(false)
        setSampling(true)
        const samples = []
        const start   = Date.now()

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - start
            setPct(Math.min((elapsed / SAMPLE_DURATION_MS) * 100, 100))

            const raw = handStateRef.current.palmRaw
            if (raw > 5) samples.push(raw)

            if (elapsed >= SAMPLE_DURATION_MS) {
                clearInterval(intervalRef.current)
                setSampling(false)
                setPct(0)

                if (samples.length < 3) { setWarn(true); return }

                const target = median(samples)
                setZoneDepth(zoneId, target, tolerance)
                setCaptured(true)
                updateRangeBar(target, tolerance)
            }
        }, SAMPLE_INTERVAL_MS)
    }, [handStateRef, zoneId, tolerance, setZoneDepth, updateRangeBar])

    const handleClose = () => {
        clearInterval(intervalRef.current)
        setSampling(false)
        setPct(0)
        setWarn(false)
        onClose()
    }

    if (!open || !zone) return null

    const calReady = !!calibration

    return (
        <div className="zdm-backdrop" onClick={e => e.target === e.currentTarget && handleClose()}>
            <div className="zdm-card">
                <div className="zdm-tag">Zone Depth Setup</div>
                <div className="zdm-title">Set Zone Depth</div>
                <div className="zdm-sub">
                    Position your hand at the depth where items will be placed in this zone, then capture.
                </div>
                <div className="zdm-zone-name" style={{ background: zone.color + '22', borderColor: zone.color + '55', color: zone.color }}>
                    {zone.label}
                </div>

                {/* Depth visualiser */}
                <div className="zdm-viz">
                    <div className="zdm-viz-labels">
                        <span>FAR</span>
                        <span>Current hand depth</span>
                        <span>NEAR</span>
                    </div>
                    <div className="zdm-track">
                        <div className="zdm-range"  ref={rangeRef}  style={{ left: 0, width: 0 }} />
                        <div className="zdm-target" ref={targetRef} style={{ left: '50%', display: 'none' }} />
                        <div className="zdm-cursor" ref={cursorRef} style={{ left: '50%' }} />
                    </div>
                    {calReady && (
                        <div className="zdm-viz-foot">
                            <span>{calibration.farPalmSize.toFixed(0)}px</span>
                            <span>palm size</span>
                            <span>{calibration.nearPalmSize.toFixed(0)}px</span>
                        </div>
                    )}
                </div>

                {!calReady && (
                    <div className="zdm-no-cal">
                        ⚠️ No global calibration found. Run "Calibrate Depth" first for the depth bar to work, but you can still capture a depth target.
                    </div>
                )}

                {/* Tolerance slider */}
                <div className="zdm-tol-label">DEPTH TOLERANCE (±px accepted)</div>
                <div className="zdm-tol-row">
                    <span className="zdm-tol-side">Tight</span>
                    <input
                        type="range" className="zdm-slider"
                        min={5} max={60} step={1} value={tolerance}
                        onChange={e => {
                            const t = parseInt(e.target.value)
                            setTolerance(t)
                            if (zone.depthTarget) updateRangeBar(zone.depthTarget, t)
                        }}
                    />
                    <span className="zdm-tol-side" style={{ textAlign: 'right' }}>Loose</span>
                    <span className="zdm-tol-val">±{tolerance}px</span>
                </div>

                {warn    && <div className="zdm-warn">✋ No hand detected — make sure your hand is visible.</div>}
                {sampling && (
                    <div className="zdm-prog-wrap">
                        <div className="zdm-prog-fill" style={{ width: `${pct}%` }} />
                        <span className="zdm-prog-label">Sampling… {Math.round(pct)}%</span>
                    </div>
                )}
                {!sampling && (
                    <button className="zdm-btn" onClick={capture}>
                        {captured ? '↺ Recapture Depth' : '📐 Capture Depth at This Zone'}
                    </button>
                )}
                <button className="zdm-skip" onClick={handleClose}>Close</button>
            </div>
        </div>
    )
}
