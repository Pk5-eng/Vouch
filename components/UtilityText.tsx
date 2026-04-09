interface UtilityTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function UtilityText({ children, className = '' }: UtilityTextProps) {
  return (
    <p className={`text-sm text-warm-400 italic leading-relaxed ${className}`}>
      {children}
    </p>
  );
}
