import { useState } from 'react';

interface ImagePreviewProps {
  imageId: string;
  prompt?: string;
}

export default function ImagePreview({ imageId, prompt }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/images/${imageId}/download`;
  const thumbnailUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/images/${imageId}/thumbnail`;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imageplayground_${imageId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
        <p className="text-gray-500">Failed to load image</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600" />
          </div>
        )}
        <img
          src={`${thumbnailUrl}?token=${localStorage.getItem('accessToken')}`}
          alt={prompt || 'Generated image'}
          className={`w-full h-auto transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />
      </div>

      {prompt && (
        <p className="text-sm text-gray-600 line-clamp-2">{prompt}</p>
      )}

      <button
        onClick={handleDownload}
        className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download
      </button>
    </div>
  );
}
