'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import TrustGroupCard from '@/components/TrustGroupCard';
import Button from '@/components/ui/Button';
import UtilityText from '@/components/UtilityText';
import EmptyState from '@/components/EmptyState';
import type { TrustGroup } from '@/lib/types';

export default function GroupsPage() {
  const [groups, setGroups] = useState<(TrustGroup & { member_count: number; latest_question?: string; latest_question_time?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchGroups = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await supabase
        .from('trust_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (!memberships?.length) {
        setLoading(false);
        return;
      }

      const groupIds = memberships.map((m) => m.group_id);
      const { data: groupsData } = await supabase
        .from('trust_groups')
        .select('*')
        .in('id', groupIds);

      if (groupsData) {
        const enriched = await Promise.all(
          groupsData.map(async (g) => {
            const { count } = await supabase
              .from('trust_group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', g.id);

            const { data: latestQ } = await supabase
              .from('questions')
              .select('title, created_at')
              .eq('trust_group_id', g.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...g,
              member_count: count || 0,
              latest_question: latestQ?.title,
              latest_question_time: latestQ?.created_at,
            };
          })
        );
        setGroups(enriched as (TrustGroup & { member_count: number; latest_question?: string; latest_question_time?: string })[]);
      }
      setLoading(false);
    };
    fetchGroups();
  }, [supabase]);

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-warm-900">Your Trust Groups</h1>
          <Link href="/groups/create">
            <Button>Create a group</Button>
          </Link>
        </div>
        <UtilityText>
          Trust groups are small circles of people whose experience and judgment you value. Ask the hard questions here.
        </UtilityText>

        {loading ? (
          <div className="text-center py-12 text-warm-400">Loading...</div>
        ) : groups.length === 0 ? (
          <EmptyState
            title="No trust groups yet"
            description="Create a trust group to ask questions in a smaller, trusted setting."
            action={
              <Link href="/groups/create">
                <Button>Create Your First Trust Group</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <TrustGroupCard key={g.id} group={g} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
