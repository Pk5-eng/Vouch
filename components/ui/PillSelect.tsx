'use client';

interface PillOption {
  value: string;
  label: string;
}

interface PillSelectProps {
  options: PillOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function PillSelect({ options, value, onChange, className = '' }: PillSelectProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
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
