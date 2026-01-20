import { create } from 'zustand';
import type { CanvasTool } from '../types';

interface CanvasState {
  // Tool settings
  tool: CanvasTool;
  brushSize: number;
  brushColor: string;
  opacity: number;

  // Drawing state
  isDrawing: boolean;

  // Canvas reference
  canvasRef: HTMLCanvasElement | null;
  maskCanvasRef: HTMLCanvasElement | null;

  // History for undo/redo
  history: ImageData[];
  historyIndex: number;
  maxHistoryLength: number;

  // Image state
  sourceImageUrl: string | null;
  imageLoaded: boolean;

  // Actions
  setTool: (tool: CanvasTool) => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: string) => void;
  setOpacity: (opacity: number) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setCanvasRef: (ref: HTMLCanvasElement | null) => void;
  setMaskCanvasRef: (ref: HTMLCanvasElement | null) => void;
  setSourceImageUrl: (url: string | null) => void;
  setImageLoaded: (loaded: boolean) => void;

  // History actions
  saveToHistory: (imageData: ImageData) => void;
  undo: () => ImageData | null;
  redo: () => ImageData | null;
  clearHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Canvas actions
  clearMask: () => void;
  invertMask: () => void;
  fillAll: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  tool: 'brush' as CanvasTool,
  brushSize: 30,
  brushColor: '#ffffff',
  opacity: 1,
  isDrawing: false,
  canvasRef: null,
  maskCanvasRef: null,
  history: [],
  historyIndex: -1,
  maxHistoryLength: 50,
  sourceImageUrl: null,
  imageLoaded: false,
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  ...initialState,

  setTool: (tool) => set({ tool }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setBrushColor: (brushColor) => set({ brushColor }),
  setOpacity: (opacity) => set({ opacity }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  setCanvasRef: (canvasRef) => set({ canvasRef }),
  setMaskCanvasRef: (maskCanvasRef) => set({ maskCanvasRef }),
  setSourceImageUrl: (sourceImageUrl) => set({ sourceImageUrl, imageLoaded: false }),
  setImageLoaded: (imageLoaded) => set({ imageLoaded }),

  saveToHistory: (imageData) => {
    const { history, historyIndex, maxHistoryLength } = get();
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);

    // Limit history length
    if (newHistory.length > maxHistoryLength) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({ historyIndex: newIndex });
      return history[newIndex];
    }
    return null;
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({ historyIndex: newIndex });
      return history[newIndex];
    }
    return null;
  },

  clearHistory: () => set({ history: [], historyIndex: -1 }),

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  clearMask: () => {
    const { maskCanvasRef } = get();
    if (maskCanvasRef) {
      const ctx = maskCanvasRef.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvasRef.width, maskCanvasRef.height);
        // Save to history
        const imageData = ctx.getImageData(0, 0, maskCanvasRef.width, maskCanvasRef.height);
        get().saveToHistory(imageData);
      }
    }
  },

  invertMask: () => {
    const { maskCanvasRef } = get();
    if (maskCanvasRef) {
      const ctx = maskCanvasRef.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, maskCanvasRef.width, maskCanvasRef.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Invert RGB values
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
          // Keep alpha as is or set to 255 if there's any color
          if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) {
            data[i + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        get().saveToHistory(imageData);
      }
    }
  },

  fillAll: () => {
    const { maskCanvasRef, brushColor } = get();
    if (maskCanvasRef) {
      const ctx = maskCanvasRef.getContext('2d');
      if (ctx) {
        ctx.fillStyle = brushColor;
        ctx.fillRect(0, 0, maskCanvasRef.width, maskCanvasRef.height);
        const imageData = ctx.getImageData(0, 0, maskCanvasRef.width, maskCanvasRef.height);
        get().saveToHistory(imageData);
      }
    }
  },

  reset: () => set(initialState),
}));

// Brush size presets
export const BRUSH_SIZE_PRESETS = [
  { label: 'S', value: 10 },
  { label: 'M', value: 30 },
  { label: 'L', value: 60 },
  { label: 'XL', value: 100 },
];
