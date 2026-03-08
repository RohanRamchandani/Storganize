import { useState, useRef, useEffect, useCallback } from 'react'
import { useDepth } from '../context/DepthContext'
import { useZones } from '../context/ZonesContext'
import { palmToDepthPosition, median } from '../lib/depthCalibration'
import './ZoneDepthModal.css'

const SAMPLE_DURATION_MS = 1200
const SAMPLE_INTERVAL_MS = 80

/**
 * Per-zone depth capture HUD.
 * Anchored to the bottom of its parent container — camera stays fully visible.
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

    const intervalRef = useRef(null)
    const rafRef      = useRef(null)
    const cursorRef   = useRef(null)
    const rangeRef    = useRef(null)
    const targetRef   = useRef(null)

    useEffect(() => {
        if (zone) setTolerance(zone.depthTolerance ?? 20)
        setCaptured(!!zone?.depthTarget)
    }, [zoneId, zone])

    // Live cursor via RAF
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
        const hs     = handStateRef.current
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
        <div className="zdm-hud">
            {/* Left: zone name + depth track */}
            <div className="zdm-hud-left">
                <div className="zdm-hud-header">
                    <span className="zdm-hud-tag">Zone Depth</span>
                    <span
                        className="zdm-zone-name"
                        style={{ background: zone.color + '22', borderColor: zone.color + '55', color: zone.color }}
                    >
                        {zone.label}
                    </span>
                    {!calReady && (
                        <span className="zdm-no-cal-inline">⚠️ Calibrate depth first</span>
                    )}
                </div>
                <div className="zdm-track-row">
                    <span className="zdm-track-end">FAR</span>
                    <div className="zdm-track">
                        <div className="zdm-range"  ref={rangeRef}  style={{ left: 0, width: 0 }} />
                        <div className="zdm-target" ref={targetRef} style={{ left: '50%', display: 'none' }} />
                        <div className="zdm-cursor" ref={cursorRef} style={{ left: '50%' }} />
                    </div>
                    <span className="zdm-track-end">NEAR</span>
                </div>
            </div>

            {/* Divider */}
            <div className="zdm-hud-divider" />

            {/* Right: tolerance + actions */}
            <div className="zdm-hud-right">
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
                    <span className="zdm-tol-side">Loose</span>
                    <span className="zdm-tol-val">±{tolerance}px</span>
                </div>
                <div className="zdm-hud-actions">
                    {warn && <span className="zdm-warn-inline">✋ No hand</span>}
                    {sampling ? (
                        <div className="zdm-prog-wrap">
                            <div className="zdm-prog-fill" style={{ width: `${pct}%` }} />
                            <span className="zdm-prog-label">Sampling… {Math.round(pct)}%</span>
                        </div>
                    ) : (
                        <button className="zdm-btn" onClick={capture}>
                            {captured ? '↺ Recapture' : '📐 Capture Depth'}
                        </button>
                    )}
                    <button className="zdm-skip" onClick={handleClose}>✕</button>
                </div>
            </div>
        </div>
    )
}
