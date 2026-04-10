interface AvatarProps {
  name: string;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg';
  veiled?: boolean;
}

export default function Avatar({ name, url, size = 'md', veiled = false }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  const initial = veiled ? '?' : name.charAt(0).toUpperCase();
  const bgColor = veiled ? 'bg-warm-300' : 'bg-indigo-100 text-indigo-700';

  if (url && !veiled) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-indigo-100 transition-transform hover:scale-105`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${bgColor} rounded-full flex items-center justify-center font-semibold shrink-0 transition-transform hover:scale-105`}
    >
      {initial}
    </div>
  );
}
