import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { useGenerationStore } from "../../stores/generationStore";
import type { ModelListResponse, JobType } from "../../types";

interface ModelSelectorProps {
  className?: string;
}

export default function ModelSelector({ className = "" }: ModelSelectorProps) {
  const { model, setModel, mode } = useGenerationStore();

  // Fetch available models
  const { data: modelsData, isLoading } = useQuery({
    queryKey: ["models"],
    queryFn: async () => {
      const response = await api.get("/models");
      return response.data as ModelListResponse;
    },
  });

  // Filter models based on current mode
  const filteredModels = modelsData?.items.filter((m) =>
    m.capabilities.includes(mode as "text2img" | "img2img" | "inpaint")
  );

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        htmlFor="model-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        AI 모델
      </label>
      <select
        id="model-select"
        value={model}
        onChange={handleModelChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
      >
        {filteredModels?.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({m.vram_requirement} VRAM)
          </option>
        ))}
      </select>
      {/* Show selected model info */}
      {filteredModels && (
        <div className="mt-1 space-y-0.5">
          <p className="text-xs text-gray-500">
            {filteredModels.find((m) => m.id === model)?.description}
          </p>
          <p className="text-xs text-gray-400">
            기본 해상도: {filteredModels.find((m) => m.id === model)?.base_resolution}px
          </p>
        </div>
      )}
    </div>
  );
}
