'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import QuestionCard from '@/components/QuestionCard';
import CategoryFilter from '@/components/CategoryFilter';
import WelcomeBanner from '@/components/WelcomeBanner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Question, TrustGroup } from '@/lib/types';

const PAGE_SIZE = 15;

export default function FeedPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [userGroups, setUserGroups] = useState<(TrustGroup & { member_count: number })[]>([]);
  const supabase = createClient();

  const fetchQuestions = useCallback(async (pageNum: number, cat: string, append = false) => {
    setLoading(true);

    let query = supabase
      .from('questions')
      .select(`
        *,
        author:users!questions_author_id_fkey(*),
        trust_group:trust_groups(*),
        responses(id)
      `)
      .in('visibility', ['global', 'veiled'])
      .order('updated_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (cat !== 'all') {
      query = query.eq('category', cat);
    }

    const { data } = await query;

    const mapped = (data || []).map((q) => {
      const isVeiled = q.is_veiled;
      return {
        ...q,
        response_count: q.responses?.length || 0,
        responses: undefined,
        author: isVeiled ? undefined : q.author,
        author_id: isVeiled ? '' : q.author_id,
      };
    }) as Question[];

    if (append) {
      setQuestions((prev) => [...prev, ...mapped]);
    } else {
      setQuestions(mapped);
    }

    setHasMore(mapped.length === PAGE_SIZE);
    setLoading(false);
  }, [supabase]);

  const fetchGroups = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase
      .from('trust_group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (!memberships?.length) return;

    const groupIds = memberships.map((m) => m.group_id);
    const { data: groups } = await supabase
      .from('trust_groups')
      .select('*')
      .in('id', groupIds);

    if (groups) {
      const groupsWithCounts = await Promise.all(
        groups.map(async (g) => {
          const { count } = await supabase
            .from('trust_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', g.id);
          return { ...g, member_count: count || 0 };
        })
      );
      setUserGroups(groupsWithCounts as (TrustGroup & { member_count: number })[]);
    }
  }, [supabase]);

  useEffect(() => {
    fetchQuestions(0, category);
    fetchGroups();
  }, [category, fetchQuestions, fetchGroups]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchQuestions(nextPage, category, true);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <WelcomeBanner />

        {/* Hero row: headline + ask button */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-warm-900">Community Questions</h1>
            <p className="text-warm-500 mt-1">Real questions, real experiences. Show up for someone.</p>
          </div>
          <div className="hidden md:block">
            <Link href="/ask">
              <Button size="lg">
                <span className="mr-2">&#10024;</span> Ask a Question
              </Button>
            </Link>
          </div>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left sidebar: categories */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-6">
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">Categories</h3>
                <CategoryFilter value={category} onChange={(v) => { setCategory(v); setPage(0); }} layout="vertical" />
              </Card>

              {/* Stats card */}
              <Card className="p-4 hidden lg:block">
                <h3 className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-3">Community</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-warm-500">Questions</span>
                    <span className="text-sm font-semibold text-warm-800">{questions.length}{hasMore ? '+' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-warm-500">Your Huddles</span>
                    <span className="text-sm font-semibold text-warm-800">{userGroups.length}</span>
                  </div>
                </div>
              </Card>
            </div>
          </aside>

          {/* Main feed */}
          <div className="lg:col-span-6 space-y-4">
            {loading && questions.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-4" />
                <p className="text-warm-400">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <Card className="text-center py-16">
                <div className="text-5xl mb-4">&#128172;</div>
                <h3 className="text-lg font-semibold text-warm-800 mb-2">No questions yet</h3>
                <p className="text-warm-400 mb-6 max-w-sm mx-auto">
                  Be the first to start a conversation. Ask something you&apos;re genuinely curious about.
                </p>
                <Link href="/ask">
                  <Button size="lg">
                    <span className="mr-2">&#10024;</span> Ask the First Question
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}
                {hasMore && (
                  <div className="text-center pt-4 pb-2">
                    <Button variant="secondary" onClick={loadMore} disabled={loading}>
                      {loading ? 'Loading...' : 'Load more'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar: Huddles */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-6">
              <Card className="p-5 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50">
                <h3 className="font-semibold text-warm-800 mb-2 flex items-center gap-2">
                  <span className="text-lg icon-hover inline-block">&#129309;</span> Huddles
                </h3>
                {userGroups.length > 0 ? (
                  <>
                    <p className="text-sm text-warm-400 mb-4 leading-relaxed">
                      Your trusted circles for the questions that matter most.
                    </p>
                    <Link href="/groups/create">
                      <Button variant="secondary" size="sm" className="w-full mb-4">
                        + New Huddle
                      </Button>
                    </Link>
                    <div className="space-y-2">
                      {userGroups.map((g) => (
                        <Link key={g.id} href={`/groups/${g.id}`} className="block group">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all">
                            <span className="text-indigo-400 text-xs">&#9679;</span>
                            <span className="text-sm text-warm-700 group-hover:text-indigo-600 transition-colors truncate">
                              {g.name}
                            </span>
                            <span className="text-xs text-warm-400 ml-auto">{g.member_count}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-warm-500 mb-4 leading-relaxed">
                      Some questions deserve a smaller audience. Create a huddle &mdash; invite people whose experience you value.
                    </p>
                    <Link href="/groups/create">
                      <Button size="sm" className="w-full">
                        <span className="mr-1.5">&#129309;</span> Create Your First Huddle
                      </Button>
                    </Link>
                  </>
                )}
              </Card>

              {/* Tip card */}
              <Card className="p-4 hidden lg:block border-amber-100 bg-gradient-to-br from-white to-amber-50/50">
                <div className="flex gap-3">
                  <span className="text-xl shrink-0">&#128161;</span>
                  <div>
                    <p className="text-xs font-semibold text-warm-600 mb-1">Pro tip</p>
                    <p className="text-xs text-warm-500 leading-relaxed">
                      The best questions are specific and honest. Share what you&apos;re actually trying to figure out &mdash; you&apos;ll get better responses.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
