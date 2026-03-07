import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { loadCalibration, saveCalibration } from '../lib/depthCalibration'
import { HandTracker } from '../lib/handTracker'

const DepthContext = createContext(null)

export function DepthProvider({ children, videoRef }) {
    // ── Calibration ────────────────────────────────────────────────
    const [calibration, setCalibrationState] = useState(() => loadCalibration())

    const setCalibration = (cal) => {
        saveCalibration(cal)
        setCalibrationState(cal)
    }

    const clearCalibration = () => {
        setCalibrationState(null)
        try { localStorage.removeItem('trackhive_cal_v3') } catch (_) {}
    }

    // ── Settings ───────────────────────────────────────────────────
    const [dwellMs, setDwellMs]         = useState(1500)
    const [graceMs, setGraceMs]         = useState(600)
    const [depthGating, setDepthGating] = useState(true)

    // ── HandTracker instance (singleton ref) ───────────────────────
    const handTrackerRef = useRef(null)

    // ── Live hand state (updated externally each frame via ref) ────
    // We expose a ref so CameraPanel can read it without re-renders
    const handStateRef = useRef({
        palmRaw:     0,
        palmSmooth:  0,
        posX:        0.5,
        posY:        0.5,
        landmarks:   null,
        handVisible: false,
        gracePeriod: false,
        lastSeenMs:  0,
        ready:       false,
    })

    // ── Init HandTracker once video is ready ───────────────────────
    const [mpReady, setMpReady]   = useState(false)
    const [mpError, setMpError]   = useState(null)

    const initHandTracker = (videoElement) => {
        if (handTrackerRef.current) return  // already initialised

        const tracker = new HandTracker(videoElement)
        handTrackerRef.current = tracker
        handStateRef.current = tracker.state  // share the same state object

        tracker.init()
            .then(() => {
                console.log('[HandTracker] MediaPipe Hands loaded')
                setMpReady(true)
            })
            .catch(err => {
                console.warn('[HandTracker] Init failed:', err.message)
                setMpError(err.message)
            })
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            handTrackerRef.current?.destroy()
        }
    }, [])

    return (
        <DepthContext.Provider value={{
            // Calibration
            calibration,
            setCalibration,
            clearCalibration,
            // Settings
            dwellMs, setDwellMs,
            graceMs, setGraceMs,
            depthGating, setDepthGating,
            // Hand tracking
            handTrackerRef,
            handStateRef,
            mpReady,
            mpError,
            initHandTracker,
        }}>
            {children}
        </DepthContext.Provider>
    )
}

export const useDepth = () => useContext(DepthContext)
