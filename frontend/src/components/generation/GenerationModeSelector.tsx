import { useGenerationStore } from '../../stores/generationStore';
import type { JobType } from '../../types';

const GENERATION_MODES: { value: JobType; label: string; description: string; icon: string }[] = [
  {
    value: 'text2img',
    label: '텍스트 to 이미지',
    description: '텍스트 설명으로 이미지 생성',
    icon: 'T',
  },
  {
    value: 'img2img',
    label: '이미지 to 이미지',
    description: '기존 이미지를 프롬프트로 변형',
    icon: 'I',
  },
];

export default function GenerationModeSelector() {
  const { mode, setMode, setSourceImage } = useGenerationStore();

  const handleModeChange = (newMode: JobType) => {
    setMode(newMode);
    // 텍스트 to 이미지로 전환 시 소스 이미지 초기화
    if (newMode === 'text2img') {
      setSourceImage(null);
    }
  };

  return (
    <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
      {GENERATION_MODES.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleModeChange(option.value)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-all duration-200
            ${
              mode === option.value
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
          title={option.description}
        >
          <span
            className={`
              w-6 h-6 flex items-center justify-center rounded text-xs font-bold
              ${
                mode === option.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-200 text-gray-500'
              }
            `}
          >
            {option.icon}
          </span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
