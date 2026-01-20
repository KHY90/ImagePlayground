export type ResizeMode = "crop" | "pad";

interface ResizeOptionsProps {
  value: ResizeMode;
  onChange: (mode: ResizeMode) => void;
}

const RESIZE_OPTIONS: {
  value: ResizeMode;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "crop",
    label: "Crop",
    description: "Crop image to fit aspect ratio (may lose edges)",
    icon: "[ ]",
  },
  {
    value: "pad",
    label: "Pad",
    description: "Add black bars to maintain full image",
    icon: "|||",
  },
];

export default function ResizeOptions({ value, onChange }: ResizeOptionsProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Resize Mode
      </label>

      <div className="grid grid-cols-2 gap-3">
        {RESIZE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              flex flex-col items-center p-3 rounded-lg border-2 transition-all
              ${
                value === option.value
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              }
            `}
          >
            <span className="text-xl mb-1 font-mono">{option.icon}</span>
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        {RESIZE_OPTIONS.find((o) => o.value === value)?.description}
      </p>
    </div>
  );
}

// Export default resize mode
export const DEFAULT_RESIZE_MODE: ResizeMode = "crop";
