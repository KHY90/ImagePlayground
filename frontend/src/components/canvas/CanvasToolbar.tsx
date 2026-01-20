import React from "react";
import { useCanvasStore } from "../../stores/canvasStore";
import { useCanvas } from "../../hooks/useCanvas";
import BrushTool from "./BrushTool";
import EraserTool from "./EraserTool";

interface CanvasToolbarProps {
  onMaskChange?: (maskData: string) => void;
  className?: string;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onMaskChange,
  className = "",
}) => {
  const { clearMask, invertMask, fillAll, brushSize, setBrushSize } =
    useCanvasStore();

  const { undo, redo, canUndo, canRedo } = useCanvas({
    width: 512,
    height: 512,
    onMaskChange,
  });

  return (
    <div
      className={`flex flex-col gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm ${className}`}
    >
      {/* Tools Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          도구
        </h3>
        <div className="space-y-2">
          <BrushTool />
          <EraserTool />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          빠른 작업
        </h3>

        {/* Undo/Redo */}
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm ${
              canUndo
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                : "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
            }`}
            title="실행 취소 (Ctrl+Z)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span>실행취소</span>
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm ${
              canRedo
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                : "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
            }`}
            title="다시 실행 (Ctrl+Shift+Z)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
              />
            </svg>
            <span>다시실행</span>
          </button>
        </div>

        {/* Clear and Invert */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              clearMask();
              if (onMaskChange) {
                const maskCanvas = useCanvasStore.getState().maskCanvasRef;
                if (maskCanvas) {
                  onMaskChange(maskCanvas.toDataURL("image/png"));
                }
              }
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
            title="마스크 전체 지우기"
          >
            <svg
              className="w-4 h-4"
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
            <span>모두 지우기</span>
          </button>

          <button
            onClick={() => {
              invertMask();
              if (onMaskChange) {
                const maskCanvas = useCanvasStore.getState().maskCanvasRef;
                if (maskCanvas) {
                  onMaskChange(maskCanvas.toDataURL("image/png"));
                }
              }
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
            title="마스크 반전"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>반전</span>
          </button>
        </div>

        {/* Fill All */}
        <button
          onClick={() => {
            fillAll();
            if (onMaskChange) {
              const maskCanvas = useCanvasStore.getState().maskCanvasRef;
              if (maskCanvas) {
                onMaskChange(maskCanvas.toDataURL("image/png"));
              }
            }
          }}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400"
          title="전체 영역 마스크"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          <span>전체 채우기</span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Quick Brush Size */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          브러시 크기: {brushSize}px
        </h3>
        <input
          type="range"
          min="5"
          max="150"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>단축키:</p>
        <ul className="list-disc list-inside">
          <li>Ctrl+Z: 실행 취소</li>
          <li>Ctrl+Shift+Z: 다시 실행</li>
        </ul>
      </div>
    </div>
  );
};

export default CanvasToolbar;
