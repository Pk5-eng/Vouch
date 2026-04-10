'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import QuestionCard from '@/components/QuestionCard';
import UtilityText from '@/components/UtilityText';
import type { User, Question, TrustGroup, UserHelpfulness } from '@/lib/types';

export default function ProfilePage() {
  const params = useParams();
  const profileId = params.id as string;

  const [profile, setProfile] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [helpfulness, setHelpfulness] = useState<UserHelpfulness | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [outcomeCount, setOutcomeCount] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [vouches, setVouches] = useState<{ context: string; by: string; group: string }[]>([]);
  const [userGroups, setUserGroups] = useState<TrustGroup[]>([]);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Profile data
      const { data: p } = await supabase
        .from('users')
        .select('*')
        .eq('id', profileId)
        .single();
      if (p) setProfile(p as User);

      // Helpfulness
      const { data: h } = await supabase
        .from('user_helpfulness')
        .select('*')
        .eq('user_id', profileId)
        .single();
      if (h) setHelpfulness(h as UserHelpfulness);

      // Questions (non-veiled only)
      const { data: qs } = await supabase
        .from('questions')
        .select(`
          *,
          author:users!questions_author_id_fkey(*),
          trust_group:trust_groups(*),
          responses(id)
        `)
        .eq('author_id', profileId)
        .eq('is_veiled', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (qs) {
        setQuestions(
          qs.map((q) => ({
            ...q,
            response_count: q.responses?.length || 0,
            responses: undefined,
          })) as Question[]
        );
      }

      // Proper question count (not limited to 10)
      const { count: qc } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profileId)
        .eq('is_veiled', false);
      setQuestionCount(qc || 0);

      // Response count
      const { count: rc } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profileId);
      setResponseCount(rc || 0);

      // Outcome count
      const { count: oc } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', profileId)
        .eq('status', 'resolved');
      setOutcomeCount(oc || 0);

      // Vouch contexts
      const { data: memberships } = await supabase
        .from('trust_group_members')
        .select(`
          vouch_context,
          group_id,
          trust_groups(name, created_by),
          users:trust_groups(created_by)
        `)
        .eq('user_id', profileId)
        .not('vouch_context', 'is', null);

      if (memberships) {
        const vouchData: { context: string; by: string; group: string }[] = [];
        for (const m of memberships) {
          if (m.vouch_context) {
            const group = m.trust_groups as any;
            if (group) {
              const { data: creator } = await supabase
                .from('users')
                .select('display_name')
                .eq('id', group.created_by)
                .single();
              vouchData.push({
                context: m.vouch_context,
                by: creator?.display_name || 'Someone',
                group: group.name || 'a group',
              });
            }
          }
        }
        setVouches(vouchData);
      }

      // Current user's groups (for invite button)
      if (user && user.id !== profileId) {
        const { data: myMemberships } = await supabase
          .from('trust_group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .eq('role', 'creator');

        if (myMemberships?.length) {
          const gIds = myMemberships.map((m) => m.group_id);
          const { data: groups } = await supabase
            .from('trust_groups')
            .select('*')
            .in('id', gIds);
          if (groups) setUserGroups(groups as TrustGroup[]);
        }
      }
    };
    fetchProfile();
  }, [supabase, profileId]);

  if (!profile) {
    return <AppShell><div className="text-center py-12 text-warm-400">Loading...</div></AppShell>;
  }

  const helpfulnessLevel = helpfulness
    ? helpfulness.total_helpful_ratings >= 30
      ? 'Highly valued'
      : helpfulness.total_helpful_ratings >= 15
        ? 'Very helpful'
        : helpfulness.total_helpful_ratings >= 5
          ? 'Helpful'
          : null
    : null;

  const isOwnProfile = currentUserId === profileId;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Avatar name={profile.display_name} url={profile.avatar_url} size="lg" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-warm-900">{profile.display_name}</h1>
              {profile.bio && (
                <p className="text-warm-500 mt-1">{profile.bio}</p>
              )}
              <p className="text-sm text-warm-400 mt-2">
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>

              <div className="flex gap-4 mt-3 text-sm text-warm-500">
                <span>{questionCount} questions asked</span>
                <span>&middot;</span>
                <span>{responseCount} experiences shared</span>
                <span>&middot;</span>
                <span>{outcomeCount} loops closed</span>
              </div>

              {/* Valued by score — always visible */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-700">
                  Valued by {helpfulness?.total_helpful_ratings || 0} {(helpfulness?.total_helpful_ratings || 0) === 1 ? 'person' : 'people'}
                </span>
                {helpfulnessLevel && (
                  <Badge variant="indigo">{helpfulnessLevel}</Badge>
                )}
              </div>
              {helpfulness && helpfulness.total_helpful_ratings > 0 && (
                <p className="text-xs text-warm-400 mt-1">
                  Across {helpfulness.questions_helped_on} {helpfulness.questions_helped_on === 1 ? 'conversation' : 'conversations'}
                </p>
              )}

              {isOwnProfile && (
                <div className="mt-4">
                  <Link href="/settings">
                    <Button variant="secondary" size="sm">Edit profile</Button>
                  </Link>
                </div>
              )}

              {!isOwnProfile && userGroups.length > 0 && (
                <div className="mt-4">
                  {userGroups.length === 1 ? (
                    <Link href={`/groups/${userGroups[0].id}/invite`}>
                      <Button variant="secondary" size="sm">
                        Invite to {userGroups[0].name}
                      </Button>
                    </Link>
                  ) : (
                    <div className="relative">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowGroupPicker(!showGroupPicker)}
                      >
                        Invite {profile.display_name} to a group
                      </Button>
                      {showGroupPicker && (
                        <div className="absolute top-full mt-1 left-0 bg-white border border-warm-200 rounded-lg shadow-lg z-10 py-1 min-w-48">
                          {userGroups.map((g) => (
                            <Link
                              key={g.id}
                              href={`/groups/${g.id}/invite`}
                              className="block px-4 py-2 text-sm text-warm-700 hover:bg-warm-50 hover:text-indigo-600"
                            >
                              {g.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        <UtilityText>
          A person&apos;s profile shows how they show up — the questions they ask, the experiences they share, and what people say about them.
        </UtilityText>

        {/* What People Say */}
        {vouches.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-warm-900 mb-3">What People Say</h2>
            <div className="space-y-3">
              {vouches.map((v, i) => (
                <div key={i} className="bg-warm-50 rounded-lg p-3">
                  <p className="text-sm text-warm-700 italic">&ldquo;{v.context}&rdquo;</p>
                  <p className="text-xs text-warm-400 mt-1">{v.by} &middot; {v.group}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-warm-900 mb-3">Recent Activity</h2>
          {questions.length > 0 ? (
            <div className="space-y-3">
              {questions.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          ) : (
            <p className="text-warm-400 text-sm">No public activity yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
