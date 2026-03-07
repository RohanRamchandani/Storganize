import { useState, useEffect, useRef } from 'react';

/**
 * useZoneTracker
 * Simulates tracking a user's location based on simple motion centroiding.
 * For the hackathon, we assume the user's hand/item is placed roughly 
 * in the center of the largest area of motion over the last 1 second.
 * 
 * Maps that physical X/Y location on screen to the closest drawn StorageZone.
 */
export function useZoneTracker(videoRef, zones) {
  const [activeZoneId, setActiveZoneId] = useState(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const prevFrameRef = useRef(null);

  useEffect(() => {
    let animationId;

    const trackMotionCentroid = () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || zones.length === 0) {
        animationId = requestAnimationFrame(trackMotionCentroid);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      // Run algorithm at lower resolution for speed
      const W = 160; 
      const H = 120;
      canvas.width = W; 
      canvas.height = H;

      ctx.drawImage(video, 0, 0, W, H);
      const currFrame = ctx.getImageData(0, 0, W, H);

      if (prevFrameRef.current) {
        let sumX = 0;
        let sumY = 0;
        let diffPixels = 0;
        const data = currFrame.data;
        const prev = prevFrameRef.current.data;

        // Calculate center of mass of motion
        for (let i = 0; i < data.length; i += 4) {
          const rDiff = Math.abs(data[i] - prev[i]);
          const gDiff = Math.abs(data[i+1] - prev[i+1]);
          const bDiff = Math.abs(data[i+2] - prev[i+2]);
          
          if (rDiff + gDiff + bDiff > 80) { // Significant pixel change
            const pixelIndex = i / 4;
            const x = pixelIndex % W;
            const y = Math.floor(pixelIndex / W);
            sumX += x;
            sumY += y;
            diffPixels++;
          }
        }

        // If enough motion happens, calculate the centroid
        if (diffPixels > (W * H * 0.05)) { // At least 5% of screen changed
          const cx = (sumX / diffPixels) / W; // Normalized 0-1
          const cy = (sumY / diffPixels) / H; // Normalized 0-1

          // Find the zone that contains this centroid, or the closest one
          let matchedZoneId = null;
          let minDistance = Infinity;

          for (const z of zones) {
            // Check if entirely inside
            if (cx >= z.x_min && cx <= z.x_max && cy >= z.y_min && cy <= z.y_max) {
              matchedZoneId = z.id;
              break;
            } else {
              // Distance to center of zone as fallback
              const zcx = z.x_min + (z.x_max - z.x_min) / 2;
              const zcy = z.y_min + (z.y_max - z.y_min) / 2;
              const dist = Math.hypot(cx - zcx, cy - zcy);
              if (dist < minDistance && dist < 0.3) { // reasonably close
                minDistance = dist;
                matchedZoneId = z.id;
              }
            }
          }

          if (matchedZoneId !== activeZoneId) {
            setActiveZoneId(matchedZoneId);
          }
        }
      }

      prevFrameRef.current = currFrame;
      animationId = requestAnimationFrame(trackMotionCentroid);
    };

    animationId = requestAnimationFrame(trackMotionCentroid);
    return () => cancelAnimationFrame(animationId);
  }, [videoRef, zones, activeZoneId]);

  return activeZoneId;
}
