import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface DrawingCanvasRef {
  clear: () => void;
  getImageData: () => string | null;
}

interface DrawingCanvasProps {
  onDrawChange?: () => void;
  debounceTime?: number;
}

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({ onDrawChange, debounceTime = 800 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (timerRef.current) {
         clearTimeout(timerRef.current);
      }
    },
    getImageData: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return canvas.toDataURL('image/png');
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Fill background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 15;
      ctx.strokeStyle = '#000000';
    }
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scaling logic in case the canvas CSS size differs from its intrinsic size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only handle primary pointer (e.g. left click, pen tip, primary touch)
    if (!e.isPrimary) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    if (timerRef.current) {
        clearTimeout(timerRef.current);
    }

    ctx.beginPath();
    const { x, y } = getCoordinates(e);
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !e.isPrimary) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !e.isPrimary) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);

    if (onDrawChange) {
       if (timerRef.current) clearTimeout(timerRef.current);
       timerRef.current = setTimeout(() => {
           onDrawChange();
       }, debounceTime);
    }
  };

  return (
    <div className="relative w-full aspect-[2/1] bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden touch-none">
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
         <defs>
           <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
             <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
           </pattern>
         </defs>
         <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <canvas
        ref={canvasRef}
        width={800} // intrinsic width
        height={400} // intrinsic height
        className="w-full h-full cursor-crosshair touch-none mix-blend-multiply relative z-10 block"
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        onPointerCancel={stopDrawing}
      />
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
