// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  dailyUsage: number;
  dailyLimit: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

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
  userId: string;
  type: JobType;
  status: JobStatus;
  parameters: JobParameters;
  resultImageId?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateJobRequest {
  type: JobType;
  parameters: JobParameters;
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
export interface Preset {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
  category: 'background' | 'object_removal' | 'style_transfer' | 'custom';
}

// Canvas Types
export interface CanvasState {
  brushSize: number;
  brushColor: string;
  tool: 'brush' | 'eraser';
  history: string[];
  historyIndex: number;
}
