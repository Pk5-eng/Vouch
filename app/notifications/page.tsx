'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import NotificationCard from '@/components/NotificationCard';
import UtilityText from '@/components/UtilityText';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setNotifications(data as Notification[]);
      setLoading(false);
    };
    fetchNotifications();
  }, [supabase]);

  const markRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-warm-900">Notifications</h1>
          {hasUnread && (
            <button
              onClick={markAllRead}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
        <UtilityText>
          You&apos;ll only hear from us when something real happens — a response to your question, someone finding your experience helpful, or an invite to a trust group.
        </UtilityText>

        {loading ? (
          <div className="text-center py-12 text-warm-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-warm-400">
            No notifications yet. They&apos;ll show up when someone responds to your questions or finds your experience helpful.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} onMarkRead={markRead} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
