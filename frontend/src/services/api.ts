import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Image API
export interface UploadedImage {
  id: string;
  width: number;
  height: number;
  file_size: number;
  mime_type: string;
}

export const imageApi = {
  upload: async (file: File): Promise<UploadedImage> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUploadedUrl: (imageId: string) =>
    `${api.defaults.baseURL}/images/upload/${imageId}`,

  getGeneratedUrl: (imageId: string) =>
    `${api.defaults.baseURL}/images/${imageId}/download`,

  getThumbnailUrl: (imageId: string) =>
    `${api.defaults.baseURL}/images/${imageId}/thumbnail`,
};

export default api;
