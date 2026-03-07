import { useEffect, useRef, useState, useCallback } from 'react';
import { evaluateFrameQuality } from '../utils/frameQuality';
import { useSettings } from '../context/SettingsContext';

/**
 * useCamera Hook
 * - Captures `<video>` frames onto an offscreen canvas
 * - Continuously evaluates frame quality 
 * - Triggers a callback ONLY when a quality frame is identified and cooldown is met
 */
export function useCamera(videoRef, onQualityFrame) {
  const { settings } = useSettings();
  const [frameMetrics, setFrameMetrics] = useState(null);
  
  // Stats for the visual counter
  const [stats, setStats] = useState({
    evaluated: 0,
    sent: 0,
  });

  const canvasRef = useRef(document.createElement('canvas'));
  const prevImageDataRef = useRef(null);
  const lastCaptureTimeRef = useRef(0);
  const requestRef = useRef(null);

  const processFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      requestRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Match canvas to video dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Draw current video frame to offscreen canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Extract pixel data (scaled down for performance: checking every 4px in the util)
    const currImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Evaluate Quality
    const quality = evaluateFrameQuality(currImageData, prevImageDataRef.current, {
      blurThreshold: settings.qualityBlurThreshold,
    });

    setFrameMetrics(quality.metrics);
    setStats(s => ({ ...s, evaluated: s.evaluated + 1 }));

    // Gate: Did it pass all checks AND is it past the cooldown?
    const now = Date.now();
    const isCooledDown = (now - lastCaptureTimeRef.current) > settings.cooldownMs;

    // Only fire if it's perfectly still, lit, and cooling off is done
    if (quality.passed && isCooledDown) {
      lastCaptureTimeRef.current = now;
      
      // Convert to base64 JPEG for Gemini
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      setStats(s => ({ ...s, sent: s.sent + 1 }));
      if (onQualityFrame) {
        onQualityFrame(base64Image, quality.metrics);
      }
    }

    // Save current frame for the next loop's diff
    prevImageDataRef.current = currImageData;
    requestRef.current = requestAnimationFrame(processFrame);

  }, [settings.qualityBlurThreshold, settings.cooldownMs, onQualityFrame, videoRef]);

  // Start/Stop Loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(requestRef.current);
  }, [processFrame]);

  return { frameMetrics, stats };
}
