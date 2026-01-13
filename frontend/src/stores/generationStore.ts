import { create } from 'zustand';
import type { JobType } from '../types';

interface GenerationState {
  // Generation mode
  mode: JobType;
  setMode: (mode: JobType) => void;

  // Prompts
  prompt: string;
  negativePrompt: string;
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (negativePrompt: string) => void;

  // Parameters
  aspectRatio: string;
  seed: number | null;
  steps: number;
  strength: number;
  setAspectRatio: (ratio: string) => void;
  setSeed: (seed: number | null) => void;
  setSteps: (steps: number) => void;
  setStrength: (strength: number) => void;

  // Source image (for img2img/inpaint)
  sourceImage: File | null;
  sourceImagePreview: string | null;
  setSourceImage: (file: File | null) => void;

  // Mask (for inpaint)
  maskData: string | null;
  setMaskData: (data: string | null) => void;

  // Current job
  currentJobId: string | null;
  setCurrentJobId: (id: string | null) => void;

  // Reset
  reset: () => void;
  resetPrompts: () => void;
}

const initialState = {
  mode: 'text2img' as JobType,
  prompt: '',
  negativePrompt: '',
  aspectRatio: '1:1',
  seed: null,
  steps: 30,
  strength: 0.8,
  sourceImage: null,
  sourceImagePreview: null,
  maskData: null,
  currentJobId: null,
};

export const useGenerationStore = create<GenerationState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  setPrompt: (prompt) => set({ prompt }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),

  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setSeed: (seed) => set({ seed }),
  setSteps: (steps) => set({ steps }),
  setStrength: (strength) => set({ strength }),

  setSourceImage: (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        set({
          sourceImage: file,
          sourceImagePreview: e.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      set({ sourceImage: null, sourceImagePreview: null });
    }
  },

  setMaskData: (maskData) => set({ maskData }),

  setCurrentJobId: (currentJobId) => set({ currentJobId }),

  reset: () => set(initialState),

  resetPrompts: () => set({ prompt: '', negativePrompt: '' }),
}));

// Aspect ratio options
export const ASPECT_RATIOS = [
  { label: '1:1 (Square)', value: '1:1' },
  { label: '16:9 (Landscape)', value: '16:9' },
  { label: '9:16 (Portrait)', value: '9:16' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
];
