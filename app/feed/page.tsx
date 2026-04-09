'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import QuestionCard from '@/components/QuestionCard';
import CategoryFilter from '@/components/CategoryFilter';
import WelcomeBanner from '@/components/WelcomeBanner';
import UtilityText from '@/components/UtilityText';
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
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (cat !== 'all') {
      query = query.eq('category', cat);
    }

    const { data } = await query;

    const mapped = (data || []).map((q) => ({
      ...q,
      response_count: q.responses?.length || 0,
      responses: undefined,
    })) as Question[];

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
      // Get member counts
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
      <div className="space-y-6">
        <WelcomeBanner />

        {/* Desktop: Ask button */}
        <div className="hidden md:flex justify-end">
          <Link href="/ask">
            <Button>Ask a Question</Button>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main feed */}
          <div className="flex-1 space-y-4">
            <CategoryFilter value={category} onChange={(v) => { setCategory(v); setPage(0); }} />
            <UtilityText>
              Real questions from the community. Respond with your experience, or ask your own.
            </UtilityText>

            {loading && questions.length === 0 ? (
              <div className="text-center py-12 text-warm-400">Loading...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-warm-400 mb-4">No questions yet. Be the first to ask!</p>
                <Link href="/ask"><Button>Ask a Question</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}
                {hasMore && (
                  <div className="text-center pt-4">
                    <Button variant="secondary" onClick={loadMore} disabled={loading}>
                      {loading ? 'Loading...' : 'Load more'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar — Trust Groups */}
          <aside className="w-full lg:w-72 shrink-0">
            <Card className="sticky top-20">
              <h3 className="font-semibold text-warm-800 mb-2 flex items-center gap-2">
                <span>&#128274;</span> Trust Groups
              </h3>
              {userGroups.length > 0 ? (
                <>
                  <p className="text-sm text-warm-400 mb-4">
                    Create a small circle of people you trust to ask the questions you wouldn&apos;t ask everyone.
                  </p>
                  <Link href="/groups/create">
                    <Button variant="secondary" size="sm" className="w-full mb-4">
                      Create a Trust Group
                    </Button>
                  </Link>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-warm-500 uppercase tracking-wider">Your groups:</p>
                    {userGroups.map((g) => (
                      <Link key={g.id} href={`/groups/${g.id}`} className="block">
                        <div className="text-sm text-warm-700 hover:text-teal-600 transition-colors">
                          &middot; {g.name} ({g.member_count} members)
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-warm-400 mb-4">
                    Some questions deserve a smaller audience. Create a trust group — invite people whose
                    experience you value — and ask the hard questions with people you trust.
                  </p>
                  <Link href="/groups/create">
                    <Button variant="secondary" size="sm" className="w-full">
                      Create Your First Trust Group
                    </Button>
                  </Link>
                </>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
