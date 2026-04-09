'use client';

import { useState } from 'react';

interface BannerProps {
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export default function Banner({ children, dismissible = true, onDismiss }: BannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 relative">
      {dismissible && (
        <button
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          className="absolute top-3 right-3 text-warm-400 hover:text-warm-600 text-lg"
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
      {children}
    </div>
  );
}
