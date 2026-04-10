interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'indigo' | 'resolved' | 'veiled' | 'amber';
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-warm-100 text-warm-600',
    indigo: 'bg-indigo-50 text-indigo-700',
    resolved: 'bg-green-50 text-green-700',
    veiled: 'bg-warm-200 text-warm-500',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
