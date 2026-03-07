import { useRef, useEffect, useState } from 'react';
import './ZoneDrawingCanvas.css';

/**
 * Overlay canvas that handles mouse drag events to draw bounding boxes.
 * Returns normalized coordinates (0.0 to 1.0) via onDrawComplete.
 */
export default function ZoneDrawingCanvas({ zones, onDrawComplete, disabled }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  // Draw existing zones + currently drawing rect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width: W, height: H } = canvas;

    ctx.clearRect(0, 0, W, H);

    // 1. Draw saved zones
    zones.forEach((z) => {
      const x = z.x_min * W;
      const y = z.y_min * H;
      const w = (z.x_max - z.x_min) * W;
      const h = (z.y_max - z.y_min) * H;

      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      ctx.font = '600 14px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(z.name, x + 6, y + 20);
      ctx.shadowBlur = 0;
    });

    // 2. Draw active drag rect
    if (isDrawing) {
      const rectX = Math.min(startPos.x, currentPos.x);
      const rectY = Math.min(startPos.y, currentPos.y);
      const rectW = Math.abs(currentPos.x - startPos.x);
      const rectH = Math.abs(currentPos.y - startPos.y);

      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.fillRect(rectX, rectY, rectW, rectH);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rectX, rectY, rectW, rectH);
      ctx.setLineDash([]);
    }
  }, [zones, isDrawing, startPos, currentPos]);

  // Keep canvas sized precisely to its CSS dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(([entry]) => {
      canvas.width = entry.contentRect.width;
      canvas.height = entry.contentRect.height;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const handleMouseDown = (e) => {
    if (disabled) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || disabled) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setCurrentPos({
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    
    // Calculate normalized coordinates 0.0 -> 1.0
    const x_min = Math.min(startPos.x, currentPos.x) / canvas.width;
    const y_min = Math.min(startPos.y, currentPos.y) / canvas.height;
    const x_max = Math.max(startPos.x, currentPos.x) / canvas.width;
    const y_max = Math.max(startPos.y, currentPos.y) / canvas.height;

    // Reject tiny accidental clicks
    if (x_max - x_min < 0.05 || y_max - y_min < 0.05) return;

    onDrawComplete({ x_min, y_min, x_max, y_max });
  };

  return (
    <canvas
      ref={canvasRef}
      className={`zone-canvas ${disabled ? 'disabled' : ''} ${isDrawing ? 'drawing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
