import { useState, useRef, useCallback } from 'react'
import { useDepth } from '../context/DepthContext'
import { buildCalibration, validateCalibration, median } from '../lib/depthCalibration'
import './CalibrationModal.css'

const SAMPLE_DURATION_MS = 1200
const SAMPLE_INTERVAL_MS = 80

/**
 * Two-step global depth calibration modal.
 * Step 1: capture near palm size (hand close — scanning distance)
 * Step 2: capture far palm size (hand at furthest shelf)
 */
export default function CalibrationModal({ open, onClose }) {
    const { handStateRef, setCalibration } = useDepth()

    const [phase, setPhase]   = useState('near')  // 'near' | 'far' | 'error' | 'done'
    const [nearVal, setNearVal] = useState(null)
    const [farVal,  setFarVal]  = useState(null)
    const [pct, setPct]         = useState(0)
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

                if (samples.length < 3) {
                    setWarn(true)
                    return
                }

                const result = median(samples)
                if (phase === 'near') {
                    setNearVal(result)
                    setPhase('far')
                } else {
                    // Validate
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

    const skip = () => { handleClose() }

    if (!open) return null

    return (
        <div className="cal-backdrop" onClick={e => e.target === e.currentTarget && handleClose()}>
            <div className="cal-card">
                <div className="cal-tag">One-Time Setup</div>
                <div className="cal-title">Depth Calibration</div>
                <div className="cal-sub">
                    Sets the palm-size scale for your room. Required before per-zone depth targeting works.
                </div>

                {/* Step indicators */}
                <div className="cal-steps">
                    <div className={`cal-dot ${phase === 'near' ? 'active' : nearVal ? 'done' : ''}`}>1</div>
                    <div className={`cal-line ${nearVal ? 'done' : ''}`} />
                    <div className={`cal-dot ${phase === 'far' ? 'active' : farVal ? 'done' : ''}`}>2</div>
                    <div className={`cal-line ${farVal ? 'done' : ''}`} />
                    <div className={`cal-dot ${phase === 'done' ? 'done' : ''}`}>✓</div>
                </div>

                {/* Content */}
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
                        {!sampling && (
                            <button className="cal-btn amber" onClick={capture}>📸 Capture Close Position</button>
                        )}
                        <button className="cal-skip" onClick={skip}>Skip (2D mode only)</button>
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
                        {!sampling && (
                            <button className="cal-btn amber" onClick={capture}>📸 Capture Far Position</button>
                        )}
                    </>
                )}

                {phase === 'error' && (
                    <>
                        <div className="cal-error">{errMsg}</div>
                        <button className="cal-btn amber" onClick={reset}>↺ Try Again</button>
                        <button className="cal-skip" onClick={skip}>Skip</button>
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

function ProgressBar({ pct }) {
    return (
        <div className="cal-prog-wrap">
            <div className="cal-prog-fill" style={{ width: `${pct}%` }} />
            <span className="cal-prog-label">Sampling… {Math.round(pct)}%</span>
        </div>
    )
}
