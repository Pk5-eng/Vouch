'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  subtext?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, subtext, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-warm-800">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border border-warm-200 bg-white px-3.5 py-2.5 text-warm-900 placeholder:text-warm-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${error ? 'border-red-400' : ''} ${className}`}
          {...props}
        />
        {subtext && !error && (
          <p className="text-xs text-warm-400 italic">{subtext}</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
