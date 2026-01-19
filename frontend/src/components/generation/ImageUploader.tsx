import { useCallback, useRef, useState } from 'react';
import { useGenerationStore } from '../../stores/generationStore';
import { imageApi, UploadedImage } from '../../services/api';

interface ImageUploaderProps {
  onUploadComplete?: (image: UploadedImage) => void;
  onError?: (error: string) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ImageUploader({ onUploadComplete, onError }: ImageUploaderProps) {
  const { sourceImagePreview, setSourceImage } = useGenerationStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // 파일 타입 검증
      if (!ALLOWED_TYPES.includes(file.type)) {
        onError?.('지원하지 않는 파일 형식입니다. PNG, JPG, WebP만 가능합니다.');
        return;
      }

      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        onError?.('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      // 미리보기 즉시 설정
      setSourceImage(file);
      setIsUploading(true);

      try {
        const response = await imageApi.upload(file);
        setUploadedImage(response);
        onUploadComplete?.(response);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '업로드 실패';
        onError?.(errorMessage);
        setSourceImage(null);
      } finally {
        setIsUploading(false);
      }
    },
    [setSourceImage, onUploadComplete, onError]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = () => {
    setSourceImage(null);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        원본 이미지
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {!sourceImagePreview ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="space-y-2">
            <div className="text-4xl">
              {isUploading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              ) : (
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {isDragOver
                ? '여기에 이미지를 놓으세요...'
                : isUploading
                ? '업로드 중...'
                : '이미지를 드래그하거나 클릭하여 선택하세요'}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, WebP (최대 10MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={sourceImagePreview}
            alt="원본"
            className="w-full rounded-lg border border-gray-200"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">업로드 중...</p>
              </div>
            </div>
          )}
          {!isUploading && (
            <>
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="이미지 제거"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {uploadedImage && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                  {uploadedImage.width} x {uploadedImage.height}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
