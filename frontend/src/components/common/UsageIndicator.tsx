interface UsageIndicatorProps {
  current: number;
  limit: number;
}

export default function UsageIndicator({ current, limit }: UsageIndicatorProps) {
  const percentage = (current / limit) * 100;
  const remaining = limit - current;
  const isLow = remaining <= 2;
  const isExhausted = remaining === 0;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Daily Usage</span>
        <span className={`text-sm font-semibold ${isExhausted ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-600'}`}>
          {current} / {limit}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isExhausted ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-primary-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {isExhausted
          ? 'Daily limit reached. Try again tomorrow!'
          : `${remaining} generation${remaining !== 1 ? 's' : ''} remaining today`}
      </p>
    </div>
  );
}
