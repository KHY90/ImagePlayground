import React from 'react';
import { useCanvasStore, BRUSH_SIZE_PRESETS } from '../../stores/canvasStore';

interface BrushToolProps {
  className?: string;
}

export const BrushTool: React.FC<BrushToolProps> = ({ className = '' }) => {
  const { brushSize, setBrushSize, brushColor, setBrushColor, tool, setTool } = useCanvasStore();

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSize(Number(e.target.value));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushColor(e.target.value);
  };

  const isActive = tool === 'brush';

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Tool Button */}
      <button
        onClick={() => setTool('brush')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
        }`}
        title="브러시 도구 (마스크 그리기)"
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
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        <span className="text-sm font-medium">브러시</span>
      </button>

      {/* Brush Settings (only show when brush is active) */}
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
                      ? 'bg-indigo-600 text-white'
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
              브러시 크기: {brushSize}px
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

          {/* Color Picker */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              마스크 색상
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brushColor}
                onChange={handleColorChange}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => setBrushColor('#ffffff')}
                  className="w-8 h-8 bg-white border-2 border-gray-300 rounded"
                  title="흰색"
                />
                <button
                  onClick={() => setBrushColor('#ff0000')}
                  className="w-8 h-8 bg-red-500 rounded"
                  title="빨간색"
                />
                <button
                  onClick={() => setBrushColor('#00ff00')}
                  className="w-8 h-8 bg-green-500 rounded"
                  title="초록색"
                />
                <button
                  onClick={() => setBrushColor('#0000ff')}
                  className="w-8 h-8 bg-blue-500 rounded"
                  title="파란색"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrushTool;
