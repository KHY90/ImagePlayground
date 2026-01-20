// Job Types
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'text2img' | 'img2img' | 'inpaint';

export interface JobParameters {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  seed?: number;
  steps?: number;
  strength?: number; // for img2img
  sourceImageId?: string; // for img2img/inpaint
  maskData?: string; // for inpaint (base64)
}

export interface Job {
  id: string;
  user_id: string;
  type: JobType;
  status: JobStatus;
  prompt: string;
  negative_prompt?: string | null;
  aspect_ratio: string;
  seed?: number | null;
  steps: number;
  strength?: number | null;
  source_image_id?: string | null;
  result_image_id?: string | null;
  error_message?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;

  // Camel case aliases for frontend convenience
  userId?: string;
  negativePrompt?: string | null;
  aspectRatio?: string;
  sourceImageId?: string | null;
  resultImageId?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface CreateJobRequest {
  type: JobType;
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: string;
  seed?: number | null;
  steps?: number;
  strength?: number;
  source_image_id?: string;
  mask_data?: string;
}

// Image Types
export interface GeneratedImage {
  id: string;
  userId: string;
  jobId: string;
  filePath: string;
  thumbnailPath?: string;
  width: number;
  height: number;
  parameters: JobParameters;
  createdAt: string;
  expiresAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  detail: string;
  statusCode: number;
}

// Generation Settings Types
export interface AspectRatioOption {
  label: string;
  value: string;
  width: number;
  height: number;
}

export interface GenerationSettings {
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  seed: number | null;
  steps: number;
  strength: number;
  mode: JobType;
  sourceImage: File | null;
  sourceImagePreview: string | null;
}

// Preset Types
export type PresetCategory =
  | 'background_replace'
  | 'object_remove'
  | 'object_add'
  | 'style_transfer'
  | 'restoration'
  | 'custom';

export interface Preset {
  id: string;
  name: string;
  name_ko?: string | null;
  description?: string | null;
  description_ko?: string | null;
  category: PresetCategory;
  default_prompt?: string | null;
  default_negative_prompt?: string | null;
  recommended_steps: number;
  recommended_strength?: number | null;
  icon?: string | null;
  thumbnail_url?: string | null;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PresetListResponse {
  items: Preset[];
  total: number;
}

// Canvas Types
export type CanvasTool = 'brush' | 'eraser';

export interface CanvasState {
  brushSize: number;
  brushColor: string;
  tool: CanvasTool;
  isDrawing: boolean;
  history: ImageData[];
  historyIndex: number;
}

export interface Point {
  x: number;
  y: number;
}
