import type { JobStatus } from '../../types';

interface JobStatusIndicatorProps {
  status: JobStatus;
  errorMessage?: string | null;
}

const STATUS_CONFIG = {
  pending: {
    label: '대기 중...',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: '...',
  },
  processing: {
    label: '이미지 생성 중...',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: '...',
  },
  completed: {
    label: '완료!',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: 'O',
  },
  failed: {
    label: '생성 실패',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: 'X',
  },
};

export default function JobStatusIndicator({ status, errorMessage }: JobStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`rounded-lg p-4 ${config.bgColor}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <p className={`font-medium ${config.color}`}>{config.label}</p>
          {errorMessage && status === 'failed' && (
            <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
          )}
          {status === 'processing' && (
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
