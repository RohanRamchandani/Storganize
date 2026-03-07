import { useEffect, useRef } from 'react';

// Shared ZoneOverlay used in the Main View to show defined zones continuously
export default function ZoneOverlay({ zones, highlightedZoneId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width: W, height: H } = canvas;

    ctx.clearRect(0, 0, W, H);

    zones.forEach((z) => {
      const x = z.x_min * W;
      const y = z.y_min * H;
      const w = (z.x_max - z.x_min) * W;
      const h = (z.y_max - z.y_min) * H;

      const isHighlighted = highlightedZoneId === z.id;

      ctx.fillStyle = isHighlighted 
        ? 'rgba(34, 197, 94, 0.3)' 
        : 'rgba(99, 102, 241, 0.15)';
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = isHighlighted ? '#22c55e' : '#6366f1';
      ctx.lineWidth = isHighlighted ? 3 : 1.5;
      if (!isHighlighted) ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      ctx.font = '600 14px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(z.name, x + 8, y + 22);
      ctx.shadowBlur = 0;

      if (isHighlighted) {
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 20;
        ctx.strokeRect(x, y, w, h);
      }
    });

  }, [zones, highlightedZoneId]);

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

  return (
    <canvas 
      ref={canvasRef} 
      className="main-zone-overlay" 
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}
    />
  );
}
