interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'teal' | 'resolved' | 'veiled';
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-warm-100 text-warm-600',
    teal: 'bg-teal-50 text-teal-700',
    resolved: 'bg-green-50 text-green-700',
    veiled: 'bg-warm-200 text-warm-500',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
