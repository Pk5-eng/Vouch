'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800',
      secondary: 'bg-warm-100 text-warm-800 hover:bg-warm-200 border border-warm-200',
      ghost: 'text-warm-600 hover:bg-warm-100 hover:text-warm-800',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
