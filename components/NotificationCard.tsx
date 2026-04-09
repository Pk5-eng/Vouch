'use client';

import Link from 'next/link';
import type { Notification } from '@/lib/types';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

export default function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const content = (
    <div
      className={`rounded-xl border p-4 transition-all ${
        notification.is_read
          ? 'bg-white border-warm-100'
          : 'bg-teal-50/50 border-teal-100'
      }`}
      onClick={() => !notification.is_read && onMarkRead?.(notification.id)}
    >
      <div className="flex items-start gap-3">
        {!notification.is_read && (
          <span className="w-2 h-2 rounded-full bg-teal-500 mt-2 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-warm-800 font-medium">{notification.title}</p>
          {notification.body && (
            <p className="text-sm text-warm-500 mt-0.5">{notification.body}</p>
          )}
          <p className="text-xs text-warm-400 mt-1">{timeAgo(notification.created_at)}</p>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }
  return content;
}
