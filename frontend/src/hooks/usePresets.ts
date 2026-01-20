import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Preset, PresetListResponse, PresetCategory } from '../types';

interface UsePresetsOptions {
  category?: PresetCategory;
}

export function usePresets(options: UsePresetsOptions = {}) {
  const { category } = options;

  const query = useQuery<Preset[]>({
    queryKey: ['presets', category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) {
        params.append('category', category);
      }
      const url = `/presets${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<PresetListResponse>(url);
      return response.data.items;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    presets: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function usePreset(presetId: string | null) {
  const query = useQuery<Preset>({
    queryKey: ['preset', presetId],
    queryFn: async () => {
      if (!presetId) throw new Error('Preset ID is required');
      const response = await api.get<Preset>(`/presets/${presetId}`);
      return response.data;
    },
    enabled: !!presetId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    preset: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
