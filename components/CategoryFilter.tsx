'use client';

import { CATEGORIES } from '@/lib/types';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const options = [{ value: 'all', label: 'All' }, ...CATEGORIES];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-teal-600 text-white'
              : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
