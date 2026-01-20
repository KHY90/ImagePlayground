import React, { useState } from 'react';
import { usePresets } from '../../hooks/usePresets';
import type { Preset, PresetCategory } from '../../types';

interface PresetSelectorProps {
  selectedPresetId?: string | null;
  onSelectPreset: (preset: Preset | null) => void;
  className?: string;
}

// Icon components for presets
const PresetIcon: React.FC<{ icon?: string | null; className?: string }> = ({
  icon,
  className = 'w-5 h-5',
}) => {
  switch (icon) {
    case 'trash':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case 'image':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'plus-circle':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'palette':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    case 'wand':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case 'user':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'cloud':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      );
    case 'edit':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      );
  }
};

// Category labels
const CATEGORY_LABELS: Record<PresetCategory, string> = {
  background_replace: '배경 교체',
  object_remove: '오브젝트 제거',
  object_add: '오브젝트 추가',
  style_transfer: '스타일 변환',
  restoration: '복원',
  custom: '사용자 정의',
};

// Category colors
const CATEGORY_COLORS: Record<PresetCategory, string> = {
  background_replace: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  object_remove: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  object_add: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  style_transfer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  restoration: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  className = '',
}) => {
  const { presets, isLoading, error } = usePresets();
  const [filterCategory, setFilterCategory] = useState<PresetCategory | null>(null);

  // Filter presets by category
  const filteredPresets = filterCategory
    ? presets.filter((p) => p.category === filterCategory)
    : presets;

  // Get unique categories
  const categories = Array.from(new Set(presets.map((p) => p.category)));

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-red-500 ${className}`}>
        프리셋을 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          편집 프리셋
        </h3>
        {selectedPresetId && (
          <button
            onClick={() => onSelectPreset(null)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            선택 해제
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filterCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilterCategory(category)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filterCategory === category
                ? 'bg-indigo-600 text-white'
                : `${CATEGORY_COLORS[category]} hover:opacity-80`
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all ${
              selectedPresetId === preset.id
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
            }`}
          >
            {/* Icon and Name */}
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`p-1.5 rounded ${
                  selectedPresetId === preset.id
                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <PresetIcon icon={preset.icon} className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {preset.name_ko || preset.name}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-left line-clamp-2">
              {preset.description_ko || preset.description || ''}
            </p>

            {/* Category Badge */}
            <div className="mt-2">
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded-full ${CATEGORY_COLORS[preset.category]}`}
              >
                {CATEGORY_LABELS[preset.category]}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredPresets.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          해당 카테고리에 프리셋이 없습니다.
        </div>
      )}
    </div>
  );
};

export default PresetSelector;
