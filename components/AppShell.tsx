'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';
import Avatar from './ui/Avatar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import type { User } from '@/lib/types';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const { theme, toggle } = useTheme();
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
      <header className="bg-white/80 backdrop-blur-md border-b border-warm-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/feed" className="text-2xl font-bold logo-gradient">
              Vouch
            </Link>
            {/* Navigation tabs inline in header */}
            {(isFeed || isGroups) && (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/feed"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isFeed
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-warm-500 hover:text-warm-700 hover:bg-warm-100'
                  }`}
                >
                  <span className="mr-1.5">&#127760;</span>Global Feed
                </Link>
                <Link
                  href="/groups"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isGroups
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-warm-500 hover:text-warm-700 hover:bg-warm-100'
                  }`}
                >
                  <span className="mr-1.5">&#129309;</span>Your Huddles
                </Link>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2.5 rounded-lg text-warm-500 hover:text-warm-700 hover:bg-warm-100 transition-all icon-hover"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <NotificationBell />
            {user && (
              <Link href={`/profile/${user.id}`} className="ml-1 group">
                <Avatar name={user.display_name} url={user.avatar_url} size="sm" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      {(isFeed || isGroups) && (
        <nav className="md:hidden bg-white border-b border-warm-100">
          <div className="px-4 flex">
            <Link
              href="/feed"
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                isFeed
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-warm-500 hover:text-warm-700'
              }`}
            >
              <span className="mr-1">&#127760;</span> Feed
            </Link>
            <Link
              href="/groups"
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                isGroups
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-warm-500 hover:text-warm-700'
              }`}
            >
              <span className="mr-1">&#129309;</span> Huddles
            </Link>
          </div>
        </nav>
      )}

      {/* Main content — full width */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Floating ask button (mobile) */}
      <Link
        href="/ask"
        className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-110 transition-all z-40 md:hidden fab-bounce"
        aria-label="Ask a question"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </div>
  );
}
