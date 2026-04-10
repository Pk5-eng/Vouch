import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-warm-100 p-5 ${hover ? 'hover-lift cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
