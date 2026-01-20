import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Job, JobStatus, CreateJobRequest, PaginatedResponse } from '../types';

interface CreateJobParams {
  type: 'text2img' | 'img2img' | 'inpaint';
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  seed?: number | null;
  steps?: number;
  strength?: number;
  sourceImageId?: string;
  maskData?: string;
}

interface JobsParams {
  page?: number;
  pageSize?: number;
  status?: JobStatus;
}

// Create job
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateJobParams) => {
      const response = await api.post('/jobs', {
        type: params.type,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || null,
        aspect_ratio: params.aspectRatio || '1:1',
        seed: params.seed || null,
        steps: params.steps || 30,
        strength: params.strength,
        source_image_id: params.sourceImageId,
        mask_data: params.maskData,
      });
      return response.data as Job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

// Get single job with polling
export function useJob(jobId: string | null, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await api.get(`/jobs/${jobId}`);
      return response.data as Job;
    },
    enabled: !!jobId && (options?.enabled !== false),
    refetchInterval: (query) => {
      const data = query.state.data as Job | null;
      // Stop polling when job is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return options?.refetchInterval ?? 2000; // Poll every 2 seconds
    },
  });
}

// Get list of jobs
export function useJobs(params?: JobsParams) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const response = await api.get('/jobs', {
        params: {
          page: params?.page || 1,
          page_size: params?.pageSize || 20,
          status: params?.status,
        },
      });
      return response.data as PaginatedResponse<Job>;
    },
  });
}

// Hook for managing generation flow
export function useGeneration() {
  const createJob = useCreateJob();
  const queryClient = useQueryClient();

  const generate = async (params: CreateJobParams) => {
    const job = await createJob.mutateAsync(params);
    return job;
  };

  const refreshJobs = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };

  return {
    generate,
    isGenerating: createJob.isPending,
    error: createJob.error,
    refreshJobs,
  };
}
