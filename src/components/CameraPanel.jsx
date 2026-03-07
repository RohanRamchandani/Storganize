import { useRef, useEffect, useState, useCallback } from 'react'
import { useItems } from '../context/ItemsContext'
import './CameraPanel.css'

// ── Motion detection constants ─────────────────────────────────
const IDLE_INTERVAL_MS = 1000
const ACTIVE_INTERVAL_MS = 120
const MOTION_THRESHOLD = 20
const IDLE_TIMEOUT_MS = 10 * 1000
const SAMPLE_W = 64, SAMPLE_H = 48
const PIXEL_W = 96, PIXEL_H = 72

// ── Gemini config ──────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const SCAN_PROMPT = `Analyze this image and identify the item being held or shown. 
Return ONLY a valid JSON object with exactly these fields:
{
  "name": "specific item name",
  "category": "general category (e.g. Tools, Electronics, Clothing, Food, Documents, Sports, Cleaning, Office, Other)",
  "item_type": "specific type within category",
  "distinguishing_features": {
    "color": "...",
    "brand": "...",
    "size": "...",
    "condition": "...",
    "material": "..."
  }
}
Include only visually distinguishable features you can actually see. Remove keys you cannot determine. Return ONLY the JSON, no markdown, no explanation.`

function frameDiff(a, b) {
    let sum = 0
    const len = a.data.length
    for (let i = 0; i < len; i += 4) {
        sum += Math.abs(a.data[i] - b.data[i])
        sum += Math.abs(a.data[i + 1] - b.data[i + 1])
        sum += Math.abs(a.data[i + 2] - b.data[i + 2])
    }
    return sum / (len / 4)
}

function fmtMs(ms) {
    const s = Math.ceil(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Scan statuses
// { state: 'idle' | 'capturing' | 'scanning' | 'success' | 'error', message }
const STATUS_IDLE = { state: 'idle', message: 'Ready to scan' }

export default function CameraPanel() {
    const videoRef = useRef(null)
    const samplerRef = useRef(null)
    const captureRef = useRef(null)   // full-res capture canvas
    const pixelRef = useRef(null)
    const prevFrame = useRef(null)
    const intervalRef = useRef(null)
    const lastMotion = useRef(null)
    const tickRef = useRef(null)
    const idleRafRef = useRef(null)

    const [mode, setMode] = useState('idle')
    const [camError, setCamError] = useState(null)
    const [camReady, setCamReady] = useState(false)
    const [diffScore, setDiffScore] = useState(0)
    const [countdown, setCountdown] = useState(null)
    const [scanStatus, setScanStatus] = useState(STATUS_IDLE)
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('stifficiency_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '')
    const [keyInput, setKeyInput] = useState('')
    const [showKeyInput, setShowKeyInput] = useState(false)

    const { addItem } = useItems()

    // ── Pixel draw (idle) ─────────────────────────────────────────
    const startPixelDraw = useCallback(() => {
        const draw = () => {
            const v = videoRef.current, c = pixelRef.current
            if (v && c && v.readyState >= 2) c.getContext('2d').drawImage(v, 0, 0, PIXEL_W, PIXEL_H)
            idleRafRef.current = requestAnimationFrame(draw)
        }
        cancelAnimationFrame(idleRafRef.current)
        idleRafRef.current = requestAnimationFrame(draw)
    }, [])
    const stopPixelDraw = useCallback(() => cancelAnimationFrame(idleRafRef.current), [])

    // ── Frame sampling ────────────────────────────────────────────
    const captureFrame = useCallback(() => {
        const v = videoRef.current, c = samplerRef.current
        if (!v || !c || v.readyState < 2) return null
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(v, 0, 0, SAMPLE_W, SAMPLE_H)
        return ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H)
    }, [])

    // ── Motion check ──────────────────────────────────────────────
    const checkMotion = useCallback(() => {
        const cur = captureFrame()
        if (!cur) return
        if (prevFrame.current) {
            const score = frameDiff(prevFrame.current, cur)
            setDiffScore(Math.round(score))
            if (score > MOTION_THRESHOLD) {
                lastMotion.current = Date.now()
                setMode(prev => {
                    if (prev === 'idle') {
                        stopPixelDraw()
                        clearInterval(intervalRef.current)
                        intervalRef.current = setInterval(checkMotion, ACTIVE_INTERVAL_MS)
                    }
                    return 'active'
                })
            }
        }
        prevFrame.current = cur
    }, [captureFrame, stopPixelDraw])

    // ── Idle countdown ────────────────────────────────────────────
    useEffect(() => {
        if (mode !== 'active') {
            setCountdown(null); clearInterval(tickRef.current); startPixelDraw(); return
        }
        tickRef.current = setInterval(() => {
            const remaining = IDLE_TIMEOUT_MS - (Date.now() - (lastMotion.current ?? Date.now()))
            if (remaining <= 0) {
                setMode('idle')
                clearInterval(intervalRef.current)
                intervalRef.current = setInterval(checkMotion, IDLE_INTERVAL_MS)
                setCountdown(null); clearInterval(tickRef.current)
            } else setCountdown(remaining)
        }, 1000)
        return () => clearInterval(tickRef.current)
    }, [mode, checkMotion, startPixelDraw])

    // ── Camera start ──────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' },
                audio: false,
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
                setCamReady(true); setCamError(null)
                prevFrame.current = null; lastMotion.current = null
                startPixelDraw()
                clearInterval(intervalRef.current)
                intervalRef.current = setInterval(checkMotion, IDLE_INTERVAL_MS)
            }
        } catch { setCamError('Camera access denied or unavailable.') }
    }, [checkMotion, startPixelDraw])

    useEffect(() => {
        startCamera()
        return () => {
            clearInterval(intervalRef.current); clearInterval(tickRef.current)
            cancelAnimationFrame(idleRafRef.current)
            videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
        }
    }, [startCamera])

    // ── Gemini scan ───────────────────────────────────────────────
    const handleScan = useCallback(async () => {
        const key = apiKey.trim()
        if (!key) { setShowKeyInput(true); return }
        if (scanStatus.state === 'scanning' || scanStatus.state === 'capturing') return

        const video = videoRef.current
        if (!video || video.readyState < 2) return

        try {
            // 1. Capture full-res frame
            setScanStatus({ state: 'capturing', message: 'Capturing frame…' })
            await new Promise(r => setTimeout(r, 80))  // let UI update

            const canvas = captureRef.current
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 480
            canvas.getContext('2d').drawImage(video, 0, 0)
            const base64 = canvas.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, '')

            // 2. Send to Gemini
            setScanStatus({ state: 'scanning', message: 'Identifying item…' })
            const res = await fetch(`${GEMINI_URL}?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { inline_data: { mime_type: 'image/jpeg', data: base64 } },
                            { text: SCAN_PROMPT },
                        ]
                    }]
                })
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err?.error?.message || `API error ${res.status}`)
            }

            const json = await res.json()
            const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''

            // 3. Parse JSON from response (strip markdown fences if present)
            const jsonMatch = rawText.match(/\{[\s\S]*\}/)
            if (!jsonMatch) throw new Error('Could not parse item data from response')
            const itemData = JSON.parse(jsonMatch[0])

            // 4. Save item
            addItem(itemData)
            setScanStatus({ state: 'success', message: `✓ ${itemData.name} scanned` })

        } catch (e) {
            console.error('Scan error:', e)
            setScanStatus({ state: 'error', message: `✗ ${e.message}` })
        } finally {
            // Auto-reset status after 4 seconds
            setTimeout(() => setScanStatus(STATUS_IDLE), 4000)
        }
    }, [apiKey, scanStatus.state, addItem])

    // Save API key
    const saveApiKey = () => {
        const k = keyInput.trim()
        if (!k) return
        localStorage.setItem('stifficiency_gemini_key', k)
        setApiKey(k)
        setKeyInput('')
        setShowKeyInput(false)
    }

    const isActive = mode === 'active'
    const isScanning = scanStatus.state === 'scanning' || scanStatus.state === 'capturing'

    return (
        <div className="camera-root">
            {/* Hidden canvases */}
            <canvas ref={samplerRef} width={SAMPLE_W} height={SAMPLE_H} style={{ display: 'none' }} />
            <canvas ref={captureRef} style={{ display: 'none' }} />
            <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />

            {/* Viewport */}
            <div className={`camera-viewport ${isActive ? 'vp-active' : 'vp-idle'}`}>
                {camError ? (
                    <div className="cam-overlay center-col">
                        <span style={{ fontSize: 36 }}>🚫</span>
                        <p className="overlay-text">{camError}</p>
                        <button className="retry-btn" onClick={startCamera}>Retry</button>
                    </div>
                ) : !camReady ? (
                    <div className="cam-overlay center-col">
                        <div className="spinner" />
                        <p className="overlay-text" style={{ marginTop: 12 }}>Starting camera…</p>
                    </div>
                ) : null}

                {/* Scanning overlay */}
                {isScanning && (
                    <div className="cam-overlay center-col scanning-overlay">
                        <div className="scan-pulse-ring" />
                        <div className="spinner" />
                        <p className="overlay-text" style={{ marginTop: 14, fontSize: 14, color: '#c4b8ff' }}>
                            {scanStatus.message}
                        </p>
                    </div>
                )}

                {isActive && camReady && <ActiveVideo srcVideo={videoRef} />}

                <canvas
                    ref={pixelRef} className="pixelated-canvas"
                    width={PIXEL_W} height={PIXEL_H}
                    style={{ display: isActive ? 'none' : 'block' }}
                />

                {/* Mode badge */}
                {camReady && (
                    <div className={`mode-badge ${isActive ? 'badge-active' : 'badge-idle'}`}>
                        <span className="badge-dot" />
                        {isActive ? 'Motion Detected' : 'Idle'}
                    </div>
                )}

                {/* Countdown */}
                {isActive && countdown !== null && (
                    <div className="countdown-badge">Idle in {fmtMs(countdown)}</div>
                )}
            </div>

            {/* Scan status bar */}
            <div className={`scan-status-bar scan-status-${scanStatus.state}`}>
                <div className="scan-status-indicator">
                    {scanStatus.state === 'idle' && <span className="status-dot-sm idle-dot" />}
                    {scanStatus.state === 'capturing' && <span className="mini-spinner" />}
                    {scanStatus.state === 'scanning' && <span className="mini-spinner" />}
                    {scanStatus.state === 'success' && <span className="status-icon">✓</span>}
                    {scanStatus.state === 'error' && <span className="status-icon err">✗</span>}
                </div>
                <span className="scan-status-text">{scanStatus.message}</span>
            </div>

            {/* API key input (inline, shown on demand) */}
            {showKeyInput && (
                <div className="api-key-bar">
                    <span className="api-key-label">🔑 Gemini API Key</span>
                    <input
                        className="api-key-input"
                        type="password"
                        placeholder="AIza…"
                        value={keyInput}
                        onChange={e => setKeyInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveApiKey()}
                        autoFocus
                    />
                    <button className="api-key-save" onClick={saveApiKey}>Save</button>
                    <button className="api-key-cancel" onClick={() => setShowKeyInput(false)}>✕</button>
                </div>
            )}

            {/* Scan button + footer stats */}
            <div className="camera-footer">
                <div className="footer-stat">
                    <span className="stat-label">Mode</span>
                    <span className={`stat-val ${isActive ? 'val-active' : 'val-idle'}`}>{isActive ? 'Active' : 'Idle'}</span>
                </div>
                <div className="footer-divider" />
                <div className="footer-stat">
                    <span className="stat-label">Sample rate</span>
                    <span className="stat-val">{isActive ? `${ACTIVE_INTERVAL_MS}ms` : `${IDLE_INTERVAL_MS}ms`}</span>
                </div>
                <div className="footer-divider" />
                <div className="footer-stat">
                    <span className="stat-label">Motion score</span>
                    <span className={`stat-val ${diffScore > MOTION_THRESHOLD ? 'val-active' : ''}`}>
                        {diffScore}<span className="stat-unit"> / {MOTION_THRESHOLD}</span>
                    </span>
                </div>
                <div className="footer-divider" />

                {/* Scan + key buttons */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 4 }}>
                    <button
                        id="scan-btn"
                        className={`scan-btn ${isScanning ? 'scan-btn-busy' : ''}`}
                        onClick={handleScan}
                        disabled={!camReady || isScanning}
                    >
                        {isScanning ? <><span className="mini-spinner" /> Scanning…</> : '📸 Scan Item'}
                    </button>
                    <button
                        id="api-key-btn"
                        className="key-btn"
                        onClick={() => setShowKeyInput(s => !s)}
                        title={apiKey ? 'API key set ✓' : 'Set Gemini API key'}
                    >
                        {apiKey ? '🔑✓' : '🔑'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function ActiveVideo({ srcVideo }) {
    const ref = useRef(null)
    useEffect(() => {
        const src = srcVideo.current
        if (ref.current && src?.srcObject) {
            ref.current.srcObject = src.srcObject
            ref.current.play().catch(() => { })
        }
    }, [srcVideo])
    return <video ref={ref} id="camera-video" className="camera-video" autoPlay muted playsInline />
}
