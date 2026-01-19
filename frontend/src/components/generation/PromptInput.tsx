import { useGenerationStore } from '../../stores/generationStore';

export default function PromptInput() {
  const { prompt, negativePrompt, setPrompt, setNegativePrompt } = useGenerationStore();

  return (
    <div className="space-y-4">
      {/* 메인 프롬프트 */}
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
          프롬프트
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          placeholder="생성하고 싶은 이미지를 설명해주세요..."
        />
        <p className="mt-1 text-xs text-gray-500">{prompt.length}/2000 글자</p>
      </div>

      {/* 네거티브 프롬프트 */}
      <div>
        <label htmlFor="negativePrompt" className="block text-sm font-medium text-gray-700 mb-1">
          네거티브 프롬프트
          <span className="text-gray-400 font-normal ml-1">(선택사항)</span>
        </label>
        <textarea
          id="negativePrompt"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          placeholder="이미지에서 제외할 요소를 입력하세요..."
        />
      </div>
    </div>
  );
}
