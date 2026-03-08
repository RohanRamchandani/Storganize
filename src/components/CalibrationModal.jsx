import { useState, useRef, useCallback } from 'react'
import { useDepth } from '../context/DepthContext'
import { buildCalibration, validateCalibration, median } from '../lib/depthCalibration'
import './CalibrationModal.css'

const SAMPLE_DURATION_MS = 1200
const SAMPLE_INTERVAL_MS = 80

/**
 * Two-step global depth calibration.
 * hud=true  → renders as a bottom-anchored HUD bar (no backdrop, camera stays visible)
 * hud=false → renders as a centered modal overlay (default, used in onboarding)
 */
export default function CalibrationModal({ open, onClose, hud = false }) {
    const { handStateRef, setCalibration } = useDepth()

    const [phase, setPhase]       = useState('near')
    const [nearVal, setNearVal]   = useState(null)
    const [farVal,  setFarVal]    = useState(null)
    const [pct, setPct]           = useState(0)
    const [sampling, setSampling] = useState(false)
    const [warn, setWarn]         = useState(false)
    const [errMsg, setErrMsg]     = useState('')
    const [summary, setSummary]   = useState('')
    const intervalRef = useRef(null)

    const reset = () => {
        clearInterval(intervalRef.current)
        setPhase('near')
        setNearVal(null)
        setFarVal(null)
        setPct(0)
        setSampling(false)
        setWarn(false)
        setErrMsg('')
    }

    const handleClose = () => { reset(); onClose() }

    const capture = useCallback(() => {
        const hs = handStateRef.current
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

                const result = median(samples)
                if (phase === 'near') {
                    setNearVal(result)
                    setPhase('far')
                } else {
                    const cal = buildCalibration(nearVal, result)
                    const { valid, reason } = validateCalibration(cal)
                    if (!valid) {
                        setFarVal(result)
                        setErrMsg(reason)
                        setPhase('error')
                    } else {
                        setFarVal(result)
                        setCalibration(cal)
                        setSummary(`Near: ${nearVal.toFixed(0)}px  ·  Far: ${result.toFixed(0)}px`)
                        setPhase('done')
                    }
                }
            }
        }, SAMPLE_INTERVAL_MS)
    }, [phase, nearVal, handStateRef, setCalibration])

    if (!open) return null

    /* ── HUD variant ── */
    if (hud) {
        return (
            <div className="cal-hud">
                {/* Left: step progress + instruction */}
                <div className="cal-hud-info">
                    <div className="cal-hud-steps">
                        <div className={`cal-dot ${phase === 'near' ? 'active' : nearVal ? 'done' : ''}`}>1</div>
                        <div className={`cal-line ${nearVal ? 'done' : ''}`} />
                        <div className={`cal-dot ${phase === 'far' ? 'active' : farVal ? 'done' : ''}`}>2</div>
                        <div className={`cal-line ${farVal ? 'done' : ''}`} />
                        <div className={`cal-dot ${phase === 'done' ? 'done' : ''}`}>✓</div>
                    </div>
                    <div className="cal-hud-text">
                        {phase === 'near' && (
                            <>
                                <div className="cal-hud-step-label">Step 1 — Scanning Distance</div>
                                <div className="cal-hud-desc">Hold your hand close to the camera — exactly where you scan an item to place it.</div>
                            </>
                        )}
                        {phase === 'far' && (
                            <>
                                <div className="cal-hud-step-label">Step 2 — Furthest Placement Distance</div>
                                <div className="cal-hud-desc">Reach to your furthest shelf or zone and keep your hand steady.</div>
                            </>
                        )}
                        {phase === 'error' && (
                            <div className="cal-hud-error">{errMsg}</div>
                        )}
                        {phase === 'done' && (
                            <div className="cal-hud-done">✅ Depth calibrated — {summary}</div>
                        )}
                    </div>
                </div>

                {/* Right: warnings + progress + actions */}
                <div className="cal-hud-actions">
                    {warn && <div className="cal-hud-warn">✋ No hand detected</div>}
                    {sampling && <ProgressBar pct={pct} compact />}
                    {!sampling && (phase === 'near' || phase === 'far') && (
                        <button className="cal-btn amber" onClick={capture}>
                            📸 {phase === 'near' ? 'Capture Close' : 'Capture Far'}
                        </button>
                    )}
                    {!sampling && phase === 'error' && (
                        <button className="cal-btn amber" onClick={reset}>↺ Try Again</button>
                    )}
                    {phase === 'done' && (
                        <button className="cal-btn green" onClick={handleClose}>Continue →</button>
                    )}
                    {phase !== 'done' && (
                        <button className="cal-skip" onClick={handleClose}>
                            {phase === 'near' ? 'Skip (2D only)' : '✕ Close'}
                        </button>
                    )}
                </div>
            </div>
        )
    }

    /* ── Modal variant (used in onboarding) ── */
    return (
        <div className="cal-backdrop" onClick={e => e.target === e.currentTarget && handleClose()}>
            <div className="cal-card">
                <div className="cal-tag">One-Time Setup</div>
                <div className="cal-title">Depth Calibration</div>
                <div className="cal-sub">
                    Sets the palm-size scale for your room. Required before per-zone depth targeting works.
                </div>

                <div className="cal-steps">
                    <div className={`cal-dot ${phase === 'near' ? 'active' : nearVal ? 'done' : ''}`}>1</div>
                    <div className={`cal-line ${nearVal ? 'done' : ''}`} />
                    <div className={`cal-dot ${phase === 'far' ? 'active' : farVal ? 'done' : ''}`}>2</div>
                    <div className={`cal-line ${farVal ? 'done' : ''}`} />
                    <div className={`cal-dot ${phase === 'done' ? 'done' : ''}`}>✓</div>
                </div>

                {phase === 'near' && (
                    <>
                        <div className="cal-instr-box">
                            <div className="cal-instr-icon">🤚</div>
                            <div className="cal-instr-title">Step 1 — Scanning Distance</div>
                            <div className="cal-instr-body">
                                Hold your hand <strong>close to the camera</strong> — exactly where you hold an item to scan it. Keep it steady, then press Capture.
                            </div>
                        </div>
                        {warn && <div className="cal-warn">✋ No hand detected — make sure your hand is visible.</div>}
                        {sampling && <ProgressBar pct={pct} />}
                        {!sampling && <button className="cal-btn amber" onClick={capture}>📸 Capture Close Position</button>}
                        <button className="cal-skip" onClick={handleClose}>Skip (2D mode only)</button>
                    </>
                )}

                {phase === 'far' && (
                    <>
                        <div className="cal-instr-box">
                            <div className="cal-instr-icon">🙌</div>
                            <div className="cal-instr-title">Step 2 — Furthest Placement Distance</div>
                            <div className="cal-instr-body">
                                Reach your hand to your <strong>furthest shelf or zone</strong>. Keep it steady, then press Capture.
                            </div>
                        </div>
                        {warn && <div className="cal-warn">✋ No hand detected — make sure your hand is visible.</div>}
                        {sampling && <ProgressBar pct={pct} />}
                        {!sampling && <button className="cal-btn amber" onClick={capture}>📸 Capture Far Position</button>}
                    </>
                )}

                {phase === 'error' && (
                    <>
                        <div className="cal-error">{errMsg}</div>
                        <button className="cal-btn amber" onClick={reset}>↺ Try Again</button>
                        <button className="cal-skip" onClick={handleClose}>Skip</button>
                    </>
                )}

                {phase === 'done' && (
                    <>
                        <div className="cal-success">
                            <span className="cal-success-ico">✅</span>
                            <p>Depth calibrated!</p>
                            <small>{summary}</small>
                        </div>
                        <button className="cal-btn green" onClick={handleClose}>Continue →</button>
                    </>
                )}
            </div>
        </div>
    )
}

function ProgressBar({ pct, compact }) {
    return (
        <div className={compact ? 'cal-prog-wrap cal-prog-compact' : 'cal-prog-wrap'}>
            <div className="cal-prog-fill" style={{ width: `${pct}%` }} />
            <span className="cal-prog-label">Sampling… {Math.round(pct)}%</span>
        </div>
    )
}
