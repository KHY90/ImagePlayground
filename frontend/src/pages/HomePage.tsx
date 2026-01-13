import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGeneration, useJob } from '../hooks/useJobs';
import { useGenerationStore } from '../stores/generationStore';
import PromptInput from '../components/generation/PromptInput';
import ParameterPanel from '../components/generation/ParameterPanel';
import GenerateButton from '../components/generation/GenerateButton';
import JobStatusIndicator from '../components/generation/JobStatusIndicator';
import ImagePreview from '../components/generation/ImagePreview';
import UsageIndicator from '../components/common/UsageIndicator';

export default function HomePage() {
  const { user } = useAuth();
  const { generate, isGenerating, error } = useGeneration();
  const {
    prompt,
    negativePrompt,
    aspectRatio,
    seed,
    steps,
    currentJobId,
    setCurrentJobId,
  } = useGenerationStore();

  // Poll for job status
  const { data: currentJob, refetch: refetchJob } = useJob(currentJobId);

  // Clear job when completed after viewing
  useEffect(() => {
    if (currentJob?.status === 'completed' || currentJob?.status === 'failed') {
      // Keep showing the result
    }
  }, [currentJob?.status]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      const job = await generate({
        type: 'text2img',
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        seed,
        steps,
      });
      setCurrentJobId(job.id);
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const handleNewGeneration = () => {
    setCurrentJobId(null);
  };

  const canGenerate = prompt.trim().length > 0 && !isGenerating && (user?.dailyUsage ?? 0) < (user?.dailyLimit ?? 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Text to Image
            </h2>

            <PromptInput />

            <div className="mt-6">
              <GenerateButton
                onClick={handleGenerate}
                disabled={!canGenerate}
                isGenerating={isGenerating || (currentJob?.status === 'pending' || currentJob?.status === 'processing')}
              />
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                {(error as Error).message || 'Something went wrong'}
              </div>
            )}
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Parameters
            </h3>
            <ParameterPanel />
          </div>
        </div>

        {/* Right Column - Preview & Status */}
        <div className="space-y-6">
          {/* Usage Indicator */}
          {user && (
            <UsageIndicator
              current={user.dailyUsage}
              limit={user.dailyLimit}
            />
          )}

          {/* Job Status */}
          {currentJob && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Generation Status
                </h3>
                {(currentJob.status === 'completed' || currentJob.status === 'failed') && (
                  <button
                    onClick={handleNewGeneration}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    New Generation
                  </button>
                )}
              </div>

              <JobStatusIndicator
                status={currentJob.status}
                errorMessage={currentJob.error_message}
              />

              {/* Result Image */}
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

          {/* Empty State */}
          {!currentJob && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎨</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready to Create
                </h3>
                <p className="text-sm text-gray-500">
                  Enter a prompt and click Generate to create an AI image
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
