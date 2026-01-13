import { useGenerationStore } from '../../stores/generationStore';

export default function PromptInput() {
  const { prompt, negativePrompt, setPrompt, setNegativePrompt } = useGenerationStore();

  return (
    <div className="space-y-4">
      {/* Main Prompt */}
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
          Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          placeholder="Describe the image you want to generate..."
        />
        <p className="mt-1 text-xs text-gray-500">{prompt.length}/2000 characters</p>
      </div>

      {/* Negative Prompt */}
      <div>
        <label htmlFor="negativePrompt" className="block text-sm font-medium text-gray-700 mb-1">
          Negative Prompt
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          id="negativePrompt"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          placeholder="What to avoid in the image..."
        />
      </div>
    </div>
  );
}
