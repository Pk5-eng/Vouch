'use client';

interface RadioCardProps {
  selected: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  description: string;
  isDefault?: boolean;
}

export default function RadioCard({ selected, onClick, icon, title, description, isDefault }: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-[140px] p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-teal-500 bg-teal-50'
          : 'border-warm-200 bg-white hover:border-warm-300'
      }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-medium text-warm-900 text-sm">
        {title}
        {isDefault && (
          <span className="text-xs text-warm-400 ml-1">(default)</span>
        )}
      </div>
      <p className="text-xs text-warm-500 mt-1 leading-relaxed">{description}</p>
    </button>
  );
}
