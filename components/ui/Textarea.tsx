'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  subtext?: string;
  error?: string;
  charCount?: number;
  maxChars?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, subtext, error, charCount, maxChars, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-warm-800">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full rounded-lg border border-warm-200 bg-white px-3.5 py-2.5 text-warm-900 placeholder:text-warm-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-y min-h-[100px] ${error ? 'border-red-400' : ''} ${className}`}
          {...props}
        />
        <div className="flex justify-between">
          <div>
            {subtext && !error && (
              <p className="text-xs text-warm-400 italic">{subtext}</p>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          {maxChars !== undefined && (
            <p className={`text-xs ${(charCount || 0) > maxChars ? 'text-red-500' : 'text-warm-400'}`}>
              {charCount || 0}/{maxChars}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
