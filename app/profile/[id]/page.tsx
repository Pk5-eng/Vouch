'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { clearLocalUser, getLocalUser, type LocalUser } from '@/lib/local-auth';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import QuestionCard from '@/components/QuestionCard';
import UtilityText from '@/components/UtilityText';
import type { User, Question, TrustGroup, UserHelpfulness } from '@/lib/types';

// Shape of the supabase `trust_group_members` row we read for vouches.
type VouchMembership = {
  vouch_context: string | null;
  group_id: string;
  trust_groups: { name: string; created_by: string } | null;
};

type FetchedProfile = {
  profile: User | null;
  helpfulness: UserHelpfulness | null;
  questions: Question[];
  questionCount: number;
  responseCount: number;
  outcomeCount: number;
  vouches: { context: string; by: string; group: string }[];
  userGroups: TrustGroup[];
  currentUserId: string;
};

const EMPTY_FETCH: FetchedProfile = {
  profile: null,
  helpfulness: null,
  questions: [],
  questionCount: 0,
  responseCount: 0,
  outcomeCount: 0,
  vouches: [],
  userGroups: [],
  currentUserId: '',
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  // Memoize the supabase client so we don't rebuild it each render.
  const supabase = useMemo(() => createClient(), []);

  // Read the local user synchronously during initial state so the first
  // render already knows if this is the viewer's own profile.
  const [localUser] = useState<LocalUser | null>(() => {
    if (typeof window === 'undefined') return null;
    return getLocalUser();
  });
  const isOwnLocalProfile = Boolean(localUser && localUser.id === profileId);

  const [data, setData] = useState<FetchedProfile>(EMPTY_FETCH);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Own profile short-circuits: we render straight from local state,
    // no supabase fetch, no loading spinner, no INP penalty.
    if (isOwnLocalProfile) return;

    let cancelled = false;

    const fetchAll = async () => {
      // Fire every independent query in parallel instead of one-after-another.
      const [
        profileRes,
        helpfulnessRes,
        questionsRes,
        questionCountRes,
        responseCountRes,
        outcomeCountRes,
        membershipsRes,
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', profileId).single(),
        supabase
          .from('user_helpfulness')
          .select('*')
          .eq('user_id', profileId)
          .single(),
        supabase
          .from('questions')
          .select(
            `*, author:users!questions_author_id_fkey(*), trust_group:trust_groups(*), responses(id)`
          )
          .eq('author_id', profileId)
          .eq('is_veiled', false)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', profileId)
          .eq('is_veiled', false),
        supabase
          .from('responses')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', profileId),
        supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', profileId)
          .eq('status', 'resolved'),
        supabase
          .from('trust_group_members')
          .select(
            `vouch_context, group_id, trust_groups(name, created_by)`
          )
          .eq('user_id', profileId)
          .not('vouch_context', 'is', null),
      ]);

      if (cancelled) return;

      // Resolve vouch creators in parallel too.
      const memberships = (membershipsRes.data || []) as unknown as VouchMembership[];
      const creatorIds = Array.from(
        new Set(
          memberships
            .map((m) => m.trust_groups?.created_by)
            .filter((id): id is string => Boolean(id))
        )
      );
      const { data: creators } = creatorIds.length
        ? await supabase.from('users').select('id, display_name').in('id', creatorIds)
        : { data: [] as { id: string; display_name: string }[] };

      if (cancelled) return;

      const creatorMap = new Map<string, string>();
      (creators || []).forEach((c) => creatorMap.set(c.id, c.display_name));

      const vouchData = memberships
        .filter((m) => m.vouch_context && m.trust_groups)
        .map((m) => ({
          context: m.vouch_context!,
          by: (m.trust_groups && creatorMap.get(m.trust_groups.created_by)) || 'Someone',
          group: m.trust_groups?.name || 'a group',
        }));

      const questions = (questionsRes.data || []).map((q: Question & { responses?: { id: string }[] }) => ({
        ...q,
        response_count: q.responses?.length || 0,
        responses: undefined,
      })) as Question[];

      // Group the state updates in startTransition so React treats them as
      // non-blocking — keeps INP low during client-side navigation.
      startTransition(() => {
        setData({
          profile: (profileRes.data as User) || null,
          helpfulness: (helpfulnessRes.data as UserHelpfulness) || null,
          questions,
          questionCount: questionCountRes.count || 0,
          responseCount: responseCountRes.count || 0,
          outcomeCount: outcomeCountRes.count || 0,
          vouches: vouchData,
          userGroups: [],
          currentUserId: localUser?.id || '',
        });
      });
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [supabase, profileId, isOwnLocalProfile, localUser]);

  const handleSignOut = () => {
    clearLocalUser();
    router.replace('/');
  };

  // --- Own profile: render instantly from localStorage, no fetch needed ---
  if (isOwnLocalProfile && localUser) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Avatar name={localUser.name} size="lg" />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-warm-900">{localUser.name}</h1>
                <p className="text-warm-500 mt-1">{localUser.email}</p>
                <p className="text-sm text-warm-400 mt-2">
                  Joined{' '}
                  {new Date(localUser.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/settings">
                    <Button variant="secondary" size="sm">
                      Edit profile
                    </Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <UtilityText>
            Your profile is how others see how you show up — the questions you
            ask, the experiences you share, and the people you vouch for.
          </UtilityText>
        </div>
      </AppShell>
    );
  }

  // --- Viewing someone else's profile ---
  const {
    profile,
    helpfulness,
    questions,
    questionCount,
    responseCount,
    outcomeCount,
    vouches,
    userGroups,
    currentUserId,
  } = data;

  if (!profile) {
    return (
      <AppShell>
        <div className="text-center py-12 text-warm-400">Loading...</div>
      </AppShell>
    );
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
                        Invite {profile.display_name} to a huddle
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
