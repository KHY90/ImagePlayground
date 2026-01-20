import { useState, useCallback } from 'react';
import { useGeneration, useJob } from '../hooks/useJobs';
import { useGenerationStore } from '../stores/generationStore';
import { UploadedImage } from '../services/api';
import GenerationModeSelector from '../components/generation/GenerationModeSelector';
import PromptInput from '../components/generation/PromptInput';
import ParameterPanel from '../components/generation/ParameterPanel';
import GenerateButton from '../components/generation/GenerateButton';
import JobStatusIndicator from '../components/generation/JobStatusIndicator';
import ImagePreview from '../components/generation/ImagePreview';
import ImageUploader from '../components/generation/ImageUploader';
import StrengthSlider from '../components/generation/StrengthSlider';
import PresetSelector from '../components/generation/PresetSelector';
import { MaskCanvas, CanvasToolbar } from '../components/canvas';
import type { Preset } from '../types';

export default function HomePage() {
  const { generate, isGenerating, error } = useGeneration();
  const {
    mode,
    prompt,
    negativePrompt,
    aspectRatio,
    seed,
    steps,
    strength,
    sourceImagePreview,
    currentJobId,
    setCurrentJobId,
    maskData,
    setMaskData,
    setPrompt,
    setNegativePrompt,
    setSteps,
    setStrength,
  } = useGenerationStore();

  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  // 마스크 변경 핸들러
  const handleMaskChange = useCallback((newMaskData: string) => {
    setMaskData(newMaskData);
  }, [setMaskData]);

  // 프리셋 선택 핸들러
  const handlePresetSelect = useCallback((preset: Preset | null) => {
    setSelectedPreset(preset);
    if (preset) {
      // 프리셋의 기본값 적용
      if (preset.default_prompt) {
        setPrompt(preset.default_prompt);
      }
      if (preset.default_negative_prompt) {
        setNegativePrompt(preset.default_negative_prompt);
      }
      if (preset.recommended_steps) {
        setSteps(preset.recommended_steps);
      }
      if (preset.recommended_strength !== null && preset.recommended_strength !== undefined) {
        setStrength(preset.recommended_strength);
      }
    }
  }, [setPrompt, setNegativePrompt, setSteps, setStrength]);

  // 작업 상태 폴링
  const { data: currentJob } = useJob(currentJobId);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // 이미지 to 이미지 또는 인페인팅 모드에서는 원본 이미지 필요
    if ((mode === 'img2img' || mode === 'inpaint') && !uploadedImageId) {
      setUploadError('먼저 원본 이미지를 업로드해주세요');
      return;
    }

    // 인페인팅 모드에서는 마스크 필요
    if (mode === 'inpaint' && !maskData) {
      setUploadError('편집할 영역을 마스크로 지정해주세요');
      return;
    }

    setUploadError(null);

    try {
      const job = await generate({
        type: mode,
        prompt: prompt.trim(),
        negative_prompt: negativePrompt.trim() || undefined,
        aspect_ratio: aspectRatio,
        seed,
        steps,
        ...((mode === 'img2img' || mode === 'inpaint') && {
          strength,
          source_image_id: uploadedImageId || undefined,
        }),
        ...(mode === 'inpaint' && {
          mask_data: maskData || undefined,
        }),
      });
      setCurrentJobId(job.id);
    } catch (err) {
      console.error('생성 실패:', err);
    }
  };

  const handleNewGeneration = () => {
    setCurrentJobId(null);
  };

  const handleUploadComplete = (image: UploadedImage) => {
    setUploadedImageId(image.id);
    setUploadError(null);
  };

  const handleUploadError = (errorMsg: string) => {
    setUploadError(errorMsg);
    setUploadedImageId(null);
  };

  const canGenerate =
    prompt.trim().length > 0 &&
    !isGenerating &&
    (mode === 'text2img' || uploadedImageId) &&
    (mode !== 'inpaint' || maskData);

  const isProcessing = currentJob?.status === 'pending' || currentJob?.status === 'processing';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽 컬럼 - 입력 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 모드 선택 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <GenerationModeSelector />
          </div>

          {/* 메인 입력 섹션 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {mode === 'text2img' ? '텍스트 to 이미지' : mode === 'img2img' ? '이미지 to 이미지' : '인페인팅'}
            </h2>

            {/* 이미지 to 이미지 또는 인페인팅 모드일 때 이미지 업로더 표시 */}
            {(mode === 'img2img' || mode === 'inpaint') && (
              <div className="mb-6">
                <ImageUploader
                  onUploadComplete={handleUploadComplete}
                  onError={handleUploadError}
                />
                {uploadError && (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                )}
              </div>
            )}

            {/* 인페인팅 모드일 때 프리셋 선택기 표시 */}
            {mode === 'inpaint' && (
              <div className="mb-6">
                <PresetSelector
                  selectedPresetId={selectedPreset?.id}
                  onSelectPreset={handlePresetSelect}
                />
              </div>
            )}

            {/* 인페인팅 모드일 때 마스크 캔버스 표시 */}
            {mode === 'inpaint' && sourceImagePreview && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  편집할 영역을 마스크로 지정하세요
                </h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <MaskCanvas
                      sourceImageUrl={sourceImagePreview}
                      width={512}
                      height={512}
                      onMaskChange={handleMaskChange}
                      className="border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div className="w-64">
                    <CanvasToolbar onMaskChange={handleMaskChange} />
                  </div>
                </div>
              </div>
            )}

            <PromptInput />

            <div className="mt-6">
              <GenerateButton
                onClick={handleGenerate}
                disabled={!canGenerate}
                isGenerating={isGenerating || isProcessing}
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                {(error as Error).message || '문제가 발생했습니다'}
              </div>
            )}
          </div>

          {/* 파라미터 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              파라미터
            </h3>
            <ParameterPanel />

            {/* 이미지 to 이미지 또는 인페인팅 모드일 때 강도 슬라이더 표시 */}
            {(mode === 'img2img' || mode === 'inpaint') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <StrengthSlider />
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 컬럼 - 미리보기 & 상태 */}
        <div className="space-y-6">
          {/* 이미지 to 이미지 모드에서 원본 이미지 미리보기 (인페인팅은 캔버스에서 표시) */}
          {mode === 'img2img' && sourceImagePreview && !currentJob && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                원본 이미지
              </h3>
              <img
                src={sourceImagePreview}
                alt="원본"
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* 인페인팅 모드에서 선택된 프리셋 정보 표시 */}
          {mode === 'inpaint' && selectedPreset && !currentJob && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                선택된 프리셋
              </h3>
              <div className="space-y-2">
                <p className="font-medium">{selectedPreset.name_ko || selectedPreset.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedPreset.description_ko || selectedPreset.description}
                </p>
                {selectedPreset.recommended_strength && (
                  <p className="text-xs text-gray-400">
                    권장 강도: {(selectedPreset.recommended_strength * 100).toFixed(0)}%
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 작업 상태 */}
          {currentJob && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  생성 상태
                </h3>
                {(currentJob.status === 'completed' || currentJob.status === 'failed') && (
                  <button
                    onClick={handleNewGeneration}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    새로 생성
                  </button>
                )}
              </div>

              <JobStatusIndicator
                status={currentJob.status}
                errorMessage={currentJob.error_message}
              />

              {/* 결과 이미지 */}
              {currentJob.status === 'completed' && currentJob.result_image_id && (
                <div className="mt-6">
                  <ImagePreview
                    imageId={currentJob.result_image_id}
                    prompt={currentJob.prompt}
                  />
                </div>
              )}
            </div>
          )}

          {/* 빈 상태 */}
          {!currentJob && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">
                  {mode === 'text2img' ? '...' : mode === 'img2img' ? '...' : '...'}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  준비 완료
                </h3>
                <p className="text-sm text-gray-500">
                  {mode === 'text2img'
                    ? '프롬프트를 입력하고 이미지 생성 버튼을 클릭하세요'
                    : mode === 'img2img'
                    ? '이미지를 업로드하고 프롬프트를 입력한 후 생성 버튼을 클릭하세요'
                    : '이미지를 업로드하고, 편집할 영역을 마스크로 지정한 후 프롬프트를 입력하세요'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
