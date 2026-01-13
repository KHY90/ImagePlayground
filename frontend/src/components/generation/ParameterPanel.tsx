import { useGenerationStore, ASPECT_RATIOS } from '../../stores/generationStore';

export default function ParameterPanel() {
  const { aspectRatio, seed, steps, setAspectRatio, setSeed, setSteps } = useGenerationStore();

  const handleSeedChange = (value: string) => {
    if (value === '' || value === '-') {
      setSeed(null);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        setSeed(num);
      }
    }
  };

  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 2147483647));
  };

  return (
    <div className="space-y-4">
      {/* Aspect Ratio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Aspect Ratio
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => setAspectRatio(ratio.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                aspectRatio === ratio.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
              }`}
            >
              {ratio.value}
            </button>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div>
        <label htmlFor="steps" className="block text-sm font-medium text-gray-700 mb-1">
          Steps: {steps}
        </label>
        <input
          type="range"
          id="steps"
          min={10}
          max={50}
          value={steps}
          onChange={(e) => setSteps(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10 (Fast)</span>
          <span>50 (Quality)</span>
        </div>
      </div>

      {/* Seed */}
      <div>
        <label htmlFor="seed" className="block text-sm font-medium text-gray-700 mb-1">
          Seed
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            id="seed"
            value={seed ?? ''}
            onChange={(e) => handleSeedChange(e.target.value)}
            min={0}
            max={2147483647}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Random"
          />
          <button
            type="button"
            onClick={generateRandomSeed}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Generate random seed"
          >
            🎲
          </button>
          {seed !== null && (
            <button
              type="button"
              onClick={() => setSeed(null)}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Clear seed"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
