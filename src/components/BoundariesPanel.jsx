import { useRef, useEffect, useState, useCallback } from 'react'
import { useZones } from '../context/ZonesContext'
import { useItems } from '../context/ItemsContext'
import ZoneDepthModal from './ZoneDepthModal'
import './BoundariesPanel.css'

function toNorm(rect, W, H) {
    return {
        x: Math.min(rect.x1, rect.x2) / W,
        y: Math.min(rect.y1, rect.y2) / H,
        w: Math.abs(rect.x2 - rect.x1) / W,
        h: Math.abs(rect.y2 - rect.y1) / H,
    }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

function drawScene(canvas, video, zones, drawing, cursorRect) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    if (video && video.readyState >= 2) ctx.drawImage(video, 0, 0, W, H)

    zones.forEach(zone => {
        const x = zone.x * W, y = zone.y * H, w = zone.w * W, h = zone.h * H
        const R = 10
        ctx.fillStyle = zone.color + '28'; roundRect(ctx, x, y, w, h, R); ctx.fill()
        ctx.strokeStyle = zone.color; ctx.lineWidth = 2
        roundRect(ctx, x, y, w, h, R); ctx.stroke()
        const PAD = 6; ctx.font = '600 12px Inter,sans-serif'
        const tagW = ctx.measureText(zone.label).width + PAD * 2
        ctx.fillStyle = zone.color; roundRect(ctx, x + 4, y + 4, tagW, 22, 5); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.fillText(zone.label, x + 4 + PAD, y + 4 + 15)
    })

    if (drawing && cursorRect) {
        const x = Math.min(cursorRect.x1, cursorRect.x2), y = Math.min(cursorRect.y1, cursorRect.y2)
        const w = Math.abs(cursorRect.x2 - cursorRect.x1), h = Math.abs(cursorRect.y2 - cursorRect.y1)
        ctx.fillStyle = 'rgba(124,106,247,0.15)'; ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = '#7c6af7'; ctx.lineWidth = 2; ctx.setLineDash([6, 3])
        ctx.strokeRect(x, y, w, h); ctx.setLineDash([])
    }
}

export default function BoundariesPanel() {
    const canvasRef = useRef(null)
    const videoRef = useRef(null)
    const rafRef = useRef(null)

    const [camError, setCamError] = useState(null)
    const [camReady, setCamReady] = useState(false)
    const [drawing, setDrawing] = useState(false)
    const [rect, setRect] = useState(null)
    const [pending, setPending] = useState(null)
    const [labelText, setLabelText] = useState('')
    const [depthZoneId, setDepthZoneId] = useState(null)

    const { zones, addZone, removeZone, setZoneDepth, clearZoneDepth } = useZones()
    const { items } = useItems()

    useEffect(() => {
        const loop = () => {
            drawScene(canvasRef.current, videoRef.current, zones, drawing, rect)
            rafRef.current = requestAnimationFrame(loop)
        }
        loop()
        return () => cancelAnimationFrame(rafRef.current)
    }, [zones, drawing, rect])

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
            }
        } catch { setCamError('Camera access denied or unavailable.') }
    }, [])

    useEffect(() => {
        startCamera()
        return () => {
            cancelAnimationFrame(rafRef.current)
            videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
        }
    }, [startCamera])

    const getCanvasPos = (e) => {
        const canvas = canvasRef.current
        const r = canvas.getBoundingClientRect()
        return {
            x: (e.clientX - r.left) * (canvas.width / r.width),
            y: (e.clientY - r.top) * (canvas.height / r.height),
        }
    }

    const onMouseDown = (e) => {
        if (pending) return
        const { x, y } = getCanvasPos(e)
        setDrawing(true); setRect({ x1: x, y1: y, x2: x, y2: y })
    }
    const onMouseMove = (e) => {
        if (!drawing) return
        const { x, y } = getCanvasPos(e)
        setRect(r => ({ ...r, x2: x, y2: y }))
    }
    const onMouseUp = () => {
        if (!drawing || !rect) return
        setDrawing(false)
        const canvas = canvasRef.current
        const norm = toNorm(rect, canvas.width, canvas.height)
        if (norm.w > 0.03 && norm.h > 0.03) { setPending(norm); setLabelText('') }
        setRect(null)
    }
    const confirmZone = () => {
        if (!labelText.trim() || !pending) return
        addZone({ label: labelText.trim(), ...pending })
        setPending(null); setLabelText('')
    }
    const cancelPending = () => { setPending(null); setLabelText('') }

    return (
        <>
            <div className="boundaries-root">
                <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />
                <div className="boundaries-viewport">
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

                    <canvas
                        ref={canvasRef} id="boundaries-canvas" className="boundaries-canvas"
                        width={1280} height={720}
                        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                        style={{ cursor: pending ? 'default' : 'crosshair' }}
                    />
                    {camReady && !pending && <div className="draw-hint">Click and drag to draw a zone</div>}
                    {pending && (
                        <div className="label-dialog fade-in">
                            <div className="label-dialog-title">Name this zone</div>
                            <input
                                id="zone-label-input" className="label-input"
                                placeholder='e.g. "Shelf 1", "Bin A"'
                                value={labelText} onChange={e => setLabelText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') confirmZone() }} autoFocus
                            />
                            <div className="label-dialog-actions">
                                <button className="btn-cancel" onClick={cancelPending}>Cancel</button>
                                <button id="confirm-zone-btn" className="btn-confirm" onClick={confirmZone} disabled={!labelText.trim()}>
                                    Save Zone
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="zone-sidebar">
                    <div className="sidebar-header">
                        <span className="sidebar-title">Defined Zones</span>
                        <span className="zone-count">{zones.length}</span>
                    </div>
                    {zones.length === 0 ? (
                        <div className="zones-empty">
                            <span style={{ fontSize: 28, opacity: 0.4 }}>🗂️</span>
                            <p>No zones yet.<br />Draw on the camera to add one.</p>
                        </div>
                    ) : (
                        <div className="zone-list">
                            {zones.map(zone => (
                                <div key={zone.id} className="zone-item">
                                    <div className="zone-color-dot" style={{ background: zone.color }} />
                                    <div className="zone-info">
                                        <div className="zone-name">
                                            {zone.label}
                                            <span className="zone-depth-badge" title={zone.depthTarget ? `Depth: ${zone.depthTarget.toFixed(0)}px ±${zone.depthTolerance}px` : '2D only'}>
                                                {zone.depthTarget ? ' ◉' : ' ○'}
                                            </span>
                                        </div>
                                        <div className="zone-meta">{Math.round(zone.w * 100)}% × {Math.round(zone.h * 100)}% · {items.filter(i => i.zone === zone.id).length} items</div>
                                    </div>
                                    <div className="zone-actions">
                                        <button
                                            className="zone-depth-btn"
                                            onClick={() => setDepthZoneId(zone.id)}
                                            title={zone.depthTarget ? 'Recapture depth' : 'Set depth'}
                                        >
                                            {zone.depthTarget ? '↺' : '⊕'} Depth
                                        </button>
                                        {zone.depthTarget && (
                                            <button
                                                className="zone-depth-clear"
                                                onClick={() => clearZoneDepth(zone.id)}
                                                title="Clear depth (2D only)"
                                            >✕</button>
                                        )}
                                        <button className="zone-remove" onClick={() => removeZone(zone.id)} title="Remove zone">🗑</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ZoneDepthModal
                open={!!depthZoneId}
                zoneId={depthZoneId}
                onClose={() => setDepthZoneId(null)}
            />
        </>
    )
}
