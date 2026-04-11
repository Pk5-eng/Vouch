'use client';

import { CATEGORIES, CATEGORY_ICONS } from '@/lib/types';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  layout?: 'horizontal' | 'vertical';
}

export default function CategoryFilter({ value, onChange, layout = 'horizontal' }: CategoryFilterProps) {
  const options = [{ value: 'all', label: 'All' }, ...CATEGORIES];

  if (layout === 'vertical') {
    return (
      <div className="space-y-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
              value === option.value
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-warm-600 hover:bg-warm-100 hover:text-warm-800'
            }`}
          >
            <span
              className="text-base w-5 text-center"
              dangerouslySetInnerHTML={{ __html: CATEGORY_ICONS[option.value === 'emotional' ? 'wellbeing' : option.value] || '&#128196;' }}
            />
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all pill-hover ${
            value === option.value
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
