/**
 * Evaluates the quality of a video frame compared to the previous frame.
 * Used as a "gate" before sending anything to the expensive Gemini API.
 * 
 * @param {ImageData} currFrame 
 * @param {ImageData} prevFrame 
 * @param {Object} config - { blurThreshold, brightnessMin, brightnessMax }
 * @returns {Object} { passed: boolean, metrics: { blurScore, brightness, edgeClear } }
 */
export function evaluateFrameQuality(currFrame, prevFrame, config) {
  const defaults = {
    blurThreshold: 8,      // lower = stricter stillness required
    brightnessMin: 40,     // too dark
    brightnessMax: 220,    // blown out
    ...config
  };

  if (!currFrame) {
    return { passed: false, metrics: { blurScore: 100, brightness: 0, edgeClear: true } };
  }

  const { data: currData, width, height } = currFrame;
  let totalBrightness = 0;
  let diffScore = 0;
  let edgeViolations = 0;
  
  const step = 4; // Check every 4th pixel for performance
  const pixelCount = (width * height) / step;

  for (let i = 0; i < currData.length; i += step * 4) {
    const r = currData[i];
    const g = currData[i + 1];
    const b = currData[i + 2];
    
    // Perceived luminance
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;

    // Motion difference (if we have a previous frame)
    if (prevFrame && prevFrame.data) {
      const pr = prevFrame.data[i];
      const pg = prevFrame.data[i + 1];
      const pb = prevFrame.data[i + 2];
      
      const diff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
      diffScore += diff / 3; // Normalize diff per pixel
    }

    // Rough edge check: If bright pixels touch the absolute edges, subject might be cut off
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    const isEdge = x < 10 || x > width - 10 || y < 10 || y > height - 10;
    
    // If it's a very light pixel at the border, it implies part of the item is cut off
    // (Assuming dark background, held item is bright. A simple heuristic for demo).
    if (isEdge && brightness > 150) {
      edgeViolations++;
    }
  }

  const avgBrightness = totalBrightness / pixelCount;
  const avgDiff = prevFrame ? (diffScore / pixelCount) : 100; // max out if no prev frame
  const edgeClear = edgeViolations < (pixelCount * 0.05); // Allow 5% noise on edge

  // Gate checks
  const isStill = avgDiff < defaults.blurThreshold;
  const hasGoodLight = avgBrightness >= defaults.brightnessMin && avgBrightness <= defaults.brightnessMax;

  // The item must be held still, well-lit, and generally fully in frame
  const passed = isStill && hasGoodLight && edgeClear;

  return {
    passed,
    metrics: {
      blurScore: Math.round(avgDiff * 10) / 10,
      brightness: Math.round(avgBrightness),
      edgeClear,
    }
  };
}
