import { useCallback, useRef, useEffect } from 'react';
import { useCanvasStore } from '../stores/canvasStore';
import type { Point } from '../types';

interface UseCanvasOptions {
  width: number;
  height: number;
  onMaskChange?: (maskData: string) => void;
}

export function useCanvas({ width, height, onMaskChange }: UseCanvasOptions) {
  const lastPointRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);

  const {
    tool,
    brushSize,
    brushColor,
    opacity,
    isDrawing,
    maskCanvasRef,
    setIsDrawing,
    saveToHistory,
    undo: storeUndo,
    redo: storeRedo,
    canUndo,
    canRedo,
  } = useCanvasStore();

  // Get drawing context
  const getContext = useCallback(() => {
    if (!maskCanvasRef) return null;
    return maskCanvasRef.getContext('2d');
  }, [maskCanvasRef]);

  // Convert mouse/touch event to canvas coordinates
  const getCanvasPoint = useCallback(
    (event: MouseEvent | TouchEvent): Point | null => {
      if (!maskCanvasRef) return null;

      const rect = maskCanvasRef.getBoundingClientRect();
      const scaleX = maskCanvasRef.width / rect.width;
      const scaleY = maskCanvasRef.height / rect.height;

      let clientX: number;
      let clientY: number;

      if ('touches' in event) {
        if (event.touches.length === 0) return null;
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [maskCanvasRef]
  );

  // Draw a line between two points
  const drawLine = useCallback(
    (from: Point, to: Point) => {
      const ctx = getContext();
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = tool === 'eraser' ? 1 : opacity;
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },
    [getContext, tool, brushSize, brushColor, opacity]
  );

  // Draw a single point (for click without drag)
  const drawPoint = useCallback(
    (point: Point) => {
      const ctx = getContext();
      if (!ctx) return;

      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : brushColor;
      ctx.globalAlpha = tool === 'eraser' ? 1 : opacity;
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    },
    [getContext, tool, brushSize, brushColor, opacity]
  );

  // Start drawing
  const startDrawing = useCallback(
    (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      const point = getCanvasPoint(event);
      if (!point) return;

      isDrawingRef.current = true;
      lastPointRef.current = point;
      setIsDrawing(true);

      // Draw initial point
      drawPoint(point);
    },
    [getCanvasPoint, setIsDrawing, drawPoint]
  );

  // Continue drawing
  const draw = useCallback(
    (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      if (!isDrawingRef.current) return;

      const point = getCanvasPoint(event);
      if (!point || !lastPointRef.current) return;

      drawLine(lastPointRef.current, point);
      lastPointRef.current = point;
    },
    [getCanvasPoint, drawLine]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      setIsDrawing(false);

      // Save to history
      const ctx = getContext();
      if (ctx && maskCanvasRef) {
        const imageData = ctx.getImageData(0, 0, maskCanvasRef.width, maskCanvasRef.height);
        saveToHistory(imageData);

        // Notify parent of mask change
        if (onMaskChange) {
          const maskData = maskCanvasRef.toDataURL('image/png');
          onMaskChange(maskData);
        }
      }
    }
  }, [setIsDrawing, getContext, maskCanvasRef, saveToHistory, onMaskChange]);

  // Undo action
  const undo = useCallback(() => {
    const imageData = storeUndo();
    const ctx = getContext();
    if (imageData && ctx) {
      ctx.putImageData(imageData, 0, 0);
      if (onMaskChange && maskCanvasRef) {
        onMaskChange(maskCanvasRef.toDataURL('image/png'));
      }
    }
  }, [storeUndo, getContext, onMaskChange, maskCanvasRef]);

  // Redo action
  const redo = useCallback(() => {
    const imageData = storeRedo();
    const ctx = getContext();
    if (imageData && ctx) {
      ctx.putImageData(imageData, 0, 0);
      if (onMaskChange && maskCanvasRef) {
        onMaskChange(maskCanvasRef.toDataURL('image/png'));
      }
    }
  }, [storeRedo, getContext, onMaskChange, maskCanvasRef]);

  // Export mask as base64
  const exportMask = useCallback((): string | null => {
    if (!maskCanvasRef) return null;
    return maskCanvasRef.toDataURL('image/png');
  }, [maskCanvasRef]);

  // Clear canvas
  const clear = useCallback(() => {
    const ctx = getContext();
    if (ctx && maskCanvasRef) {
      ctx.clearRect(0, 0, maskCanvasRef.width, maskCanvasRef.height);
      const imageData = ctx.getImageData(0, 0, maskCanvasRef.width, maskCanvasRef.height);
      saveToHistory(imageData);
      if (onMaskChange) {
        onMaskChange(maskCanvasRef.toDataURL('image/png'));
      }
    }
  }, [getContext, maskCanvasRef, saveToHistory, onMaskChange]);

  // Initialize canvas with empty history entry
  useEffect(() => {
    const ctx = getContext();
    if (ctx && maskCanvasRef) {
      const imageData = ctx.getImageData(0, 0, maskCanvasRef.width, maskCanvasRef.height);
      saveToHistory(imageData);
    }
  }, [maskCanvasRef, width, height]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    startDrawing,
    draw,
    stopDrawing,
    undo,
    redo,
    canUndo: canUndo(),
    canRedo: canRedo(),
    exportMask,
    clear,
    isDrawing,
  };
}
