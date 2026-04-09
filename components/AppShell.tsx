'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';
import Avatar from './ui/Avatar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { User } from '@/lib/types';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        if (data) setUser(data as User);
      }
    };
    fetchUser();
  }, [supabase]);

  const isFeed = pathname === '/feed' || pathname === '/';
  const isGroups = pathname.startsWith('/groups');

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Top bar */}
      <header className="bg-white border-b border-warm-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/feed" className="text-xl font-bold text-teal-700">
            Vouch
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            {user && (
              <Link href={`/profile/${user.id}`} className="ml-1">
                <Avatar name={user.display_name} url={user.avatar_url} size="sm" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Navigation tabs (only on feed/groups pages) */}
      {(isFeed || isGroups) && (
        <nav className="bg-white border-b border-warm-100">
          <div className="max-w-3xl mx-auto px-4 flex">
            <Link
              href="/feed"
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isFeed
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-warm-500 hover:text-warm-700'
              }`}
            >
              &#127760; Global Feed
            </Link>
            <Link
              href="/groups"
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isGroups
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-warm-500 hover:text-warm-700'
              }`}
            >
              &#128101; Your Trust Groups
            </Link>
          </div>
        </nav>
      )}

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Floating ask button (mobile) */}
      <Link
        href="/ask"
        className="fixed bottom-6 right-6 bg-teal-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-teal-700 transition-colors z-40 md:hidden"
        aria-label="Ask a question"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </div>
  );
}
