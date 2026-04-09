'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import QuestionCard from '@/components/QuestionCard';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import UtilityText from '@/components/UtilityText';
import EmptyState from '@/components/EmptyState';
import type { Question, TrustGroup, TrustGroupMember } from '@/lib/types';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<TrustGroup | null>(null);
  const [members, setMembers] = useState<TrustGroupMember[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    // Fetch group
    const { data: g } = await supabase
      .from('trust_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (g) setGroup(g as TrustGroup);

    // Fetch members with user info
    const { data: m } = await supabase
      .from('trust_group_members')
      .select(`*, users(*)`)
      .eq('group_id', groupId);

    if (m) setMembers(m as TrustGroupMember[]);

    // Fetch group questions
    const { data: qs } = await supabase
      .from('questions')
      .select(`
        *,
        author:users!questions_author_id_fkey(*),
        trust_group:trust_groups(*),
        responses(id)
      `)
      .eq('trust_group_id', groupId)
      .order('created_at', { ascending: false });

    if (qs) {
      setQuestions(
        qs.map((q) => ({
          ...q,
          response_count: q.responses?.length || 0,
          responses: undefined,
        })) as Question[]
      );
    }

    setLoading(false);
  }, [supabase, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !group) {
    return <AppShell><div className="text-center py-12 text-warm-400">Loading...</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-warm-900">{group.name}</h1>
            <div className="flex gap-2">
              <Link href={`/groups/${groupId}/invite`}>
                <Button variant="secondary" size="sm">Invite someone</Button>
              </Link>
              <Link href={`/ask?group=${groupId}`}>
                <Button size="sm">Ask this group</Button>
              </Link>
            </div>
          </div>
          {group.description && (
            <p className="text-warm-500 mb-2">{group.description}</p>
          )}
          <p className="text-sm text-warm-400">{members.length} members</p>
        </div>

        <UtilityText>
          Questions here are only visible to group members. This is a space for the questions that need a trusted audience.
        </UtilityText>

        {/* Members section */}
        <div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            {showMembers ? 'Hide' : 'Show'} members ({members.length})
            <span className="text-xs">{showMembers ? '▲' : '▼'}</span>
          </button>
          {showMembers && (
            <div className="mt-3 space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-start gap-3 bg-warm-50 rounded-lg p-3">
                  <Avatar
                    name={(m.users as any)?.display_name || 'User'}
                    url={(m.users as any)?.avatar_url}
                    size="sm"
                  />
                  <div>
                    <Link
                      href={`/profile/${m.user_id}`}
                      className="text-sm font-medium text-warm-800 hover:text-teal-600"
                    >
                      {(m.users as any)?.display_name || 'User'}
                    </Link>
                    {m.role === 'creator' && (
                      <span className="text-xs text-teal-600 ml-2">Creator</span>
                    )}
                    {m.vouch_context && (
                      <p className="text-xs text-warm-400 mt-0.5 italic">&ldquo;{m.vouch_context}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Questions */}
        {questions.length === 0 ? (
          <EmptyState
            title="No questions yet"
            description="Be the first to ask this group a question."
            action={
              <Link href={`/ask?group=${groupId}`}>
                <Button>Ask this group</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
