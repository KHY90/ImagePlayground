import React, { useRef, useEffect, useCallback } from "react";
import { useCanvasStore } from "../../stores/canvasStore";
import { useCanvas } from "../../hooks/useCanvas";

interface MaskCanvasProps {
  sourceImageUrl: string;
  width?: number;
  height?: number;
  onMaskChange?: (maskData: string) => void;
  className?: string;
}

export const MaskCanvas: React.FC<MaskCanvasProps> = ({
  sourceImageUrl,
  width = 512,
  height = 512,
  onMaskChange,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const { setMaskCanvasRef, setSourceImageUrl, setImageLoaded, brushSize } =
    useCanvasStore();

  const { startDrawing, draw, stopDrawing } = useCanvas({
    width,
    height,
    onMaskChange,
  });

  // Set mask canvas ref in store
  useEffect(() => {
    if (maskCanvasRef.current) {
      setMaskCanvasRef(maskCanvasRef.current);
    }
    return () => setMaskCanvasRef(null);
  }, [setMaskCanvasRef]);

  // Load source image
  useEffect(() => {
    if (!sourceImageUrl || !sourceCanvasRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = sourceCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear and draw image
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      setImageLoaded(true);
      setSourceImageUrl(sourceImageUrl);
    };
    img.onerror = () => {
      console.error("Failed to load source image");
      setImageLoaded(false);
    };
    img.src = sourceImageUrl;
  }, [sourceImageUrl, width, height, setImageLoaded, setSourceImageUrl]);

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      startDrawing(e.nativeEvent);
    },
    [startDrawing],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      draw(e.nativeEvent);
    },
    [draw],
  );

  const handleMouseUp = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  const handleMouseLeave = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  // Handle touch events
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      startDrawing(e.nativeEvent);
    },
    [startDrawing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      draw(e.nativeEvent);
    },
    [draw],
  );

  const handleTouchEnd = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  // Custom cursor based on brush size
  const cursorStyle = {
    cursor: "none",
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{ width, height }}
    >
      {/* Source image layer */}
      <canvas
        ref={sourceCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Mask layer (interactive) */}
      <canvas
        ref={maskCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0"
        style={{
          ...cursorStyle,
          zIndex: 2,
          opacity: 0.5,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Custom cursor indicator */}
      <div
        className="pointer-events-none fixed rounded-full border-2 border-white mix-blend-difference"
        style={{
          width: brushSize,
          height: brushSize,
          transform: "translate(-50%, -50%)",
          zIndex: 100,
          display: "none",
        }}
        id="brush-cursor"
      />
    </div>
  );
};

export default MaskCanvas;
