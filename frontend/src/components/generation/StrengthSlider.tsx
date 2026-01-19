import { useGenerationStore } from '../../stores/generationStore';

export default function StrengthSlider() {
  const { strength, setStrength } = useGenerationStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrength(parseFloat(e.target.value));
  };

  // 강도에 따른 라벨 결정
  const getStrengthLabel = (value: number) => {
    if (value <= 0.3) return '미세';
    if (value <= 0.5) return '약함';
    if (value <= 0.7) return '보통';
    if (value <= 0.85) return '강함';
    return '매우 강함';
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          변형 강도
        </label>
        <span className="text-sm text-gray-500">
          {getStrengthLabel(strength)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={strength}
          onChange={handleChange}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
        />
        <span className="text-sm font-medium text-gray-900 w-12 text-right">
          {(strength * 100).toFixed(0)}%
        </span>
      </div>

      <p className="text-xs text-gray-500">
        낮을수록 원본 이미지를 유지하고, 높을수록 더 창의적으로 변형합니다.
      </p>

      {/* 시각적 인디케이터 */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>원본 유지</span>
        <span>창의적 변형</span>
      </div>
    </div>
  );
}
