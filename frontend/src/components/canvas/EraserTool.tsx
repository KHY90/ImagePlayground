import React from 'react';
import { useCanvasStore, BRUSH_SIZE_PRESETS } from '../../stores/canvasStore';

interface EraserToolProps {
  className?: string;
}

export const EraserTool: React.FC<EraserToolProps> = ({ className = '' }) => {
  const { brushSize, setBrushSize, tool, setTool } = useCanvasStore();

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSize(Number(e.target.value));
  };

  const isActive = tool === 'eraser';

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Tool Button */}
      <button
        onClick={() => setTool('eraser')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-pink-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
        }`}
        title="지우개 도구 (마스크 지우기)"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        <span className="text-sm font-medium">지우개</span>
      </button>

      {/* Eraser Settings (only show when eraser is active) */}
      {isActive && (
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {/* Size Presets */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
              크기 프리셋
            </label>
            <div className="flex gap-2">
              {BRUSH_SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setBrushSize(preset.value)}
                  className={`flex-1 py-1 text-sm rounded ${
                    brushSize === preset.value
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Slider */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              지우개 크기: {brushSize}px
            </label>
            <input
              type="range"
              min="5"
              max="150"
              value={brushSize}
              onChange={handleBrushSizeChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EraserTool;
