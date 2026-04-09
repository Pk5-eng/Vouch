'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import UtilityText from '@/components/UtilityText';
import Avatar from '@/components/ui/Avatar';
import type { User } from '@/lib/types';

export default function CreateGroupPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [invitees, setInvitees] = useState<{ user: User; context: string }[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<(User & { rating_count: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Search for users
  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim().length < 2) { setSearchResults([]); return; }

      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('users')
        .select('*')
        .ilike('display_name', `%${searchQuery}%`)
        .neq('id', user?.id || '')
        .limit(5);

      const invitedIds = new Set(invitees.map((i) => i.user.id));
      setSearchResults((data || []).filter((u) => !invitedIds.has(u.id)) as User[]);
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase, invitees]);

  // Fetch suggested helpful users
  useEffect(() => {
    const fetchSuggested = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get users the current user has rated as helpful
      const { data: ratings } = await supabase
        .from('helpfulness_ratings')
        .select('response_id')
        .eq('rated_by', user.id);

      if (!ratings?.length) return;

      const responseIds = ratings.map((r) => r.response_id);
      const { data: responses } = await supabase
        .from('responses')
        .select('author_id')
        .in('id', responseIds);

      if (!responses?.length) return;

      // Count per author
      const authorCounts: Record<string, number> = {};
      responses.forEach((r) => {
        authorCounts[r.author_id] = (authorCounts[r.author_id] || 0) + 1;
      });

      const authorIds = Object.keys(authorCounts).filter((id) => id !== user.id);
      if (!authorIds.length) return;

      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('id', authorIds)
        .limit(5);

      if (users) {
        setSuggestedUsers(
          users
            .map((u) => ({ ...u, rating_count: authorCounts[u.id] || 0 }))
            .sort((a, b) => b.rating_count - a.rating_count) as (User & { rating_count: number })[]
        );
      }
    };
    fetchSuggested();
  }, [supabase]);

  const addInvitee = (user: User) => {
    setInvitees([...invitees, { user, context: '' }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeInvitee = (userId: string) => {
    setInvitees(invitees.filter((i) => i.user.id !== userId));
  };

  const updateContext = (userId: string, context: string) => {
    setInvitees(invitees.map((i) => i.user.id === userId ? { ...i, context } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter a group name.'); return; }
    if (invitees.length === 0) { setError('Please add at least one member.'); return; }
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    // Create group
    const { data: group, error: createError } = await supabase
      .from('trust_groups')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (createError || !group) {
      setError(createError?.message || 'Failed to create group');
      setLoading(false);
      return;
    }

    // Add creator as member
    await supabase.from('trust_group_members').insert({
      group_id: group.id,
      user_id: user.id,
      role: 'creator',
    });

    // Add invitees
    const memberInserts = invitees.map((i) => ({
      group_id: group.id,
      user_id: i.user.id,
      role: 'member' as const,
      vouch_context: i.context.trim() || null,
    }));

    await supabase.from('trust_group_members').insert(memberInserts);

    // Notify invitees
    const { data: profile } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const notifications = invitees.map((i) => ({
      user_id: i.user.id,
      type: 'group_invite' as const,
      title: `${profile?.display_name || 'Someone'} invited you to "${name.trim()}"`,
      body: i.context.trim() ? `They said: "${i.context.trim()}"` : null,
      link: `/groups/${group.id}`,
    }));

    await supabase.from('notifications').insert(notifications);

    router.push(`/groups/${group.id}`);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Create a Trust Group</h1>
        <UtilityText className="mb-6">
          A trust group is a small circle of people whose experience and judgment you value. Ask questions here that you wouldn&apos;t ask everyone.
        </UtilityText>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Career Brain Trust, Close Friends, Startup Crew"
            maxLength={50}
            required
          />

          <Textarea
            label="What's this group for? (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group for?"
            maxChars={200}
            charCount={description.length}
            maxLength={200}
          />

          {/* Invite members */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-warm-800">
              Invite members
            </label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for people by name..."
            />

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="bg-white border border-warm-200 rounded-lg divide-y divide-warm-100">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addInvitee(user)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-warm-50 transition-colors text-left"
                  >
                    <Avatar name={user.display_name} url={user.avatar_url} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-warm-800">{user.display_name}</p>
                      {user.bio && <p className="text-xs text-warm-400 truncate">{user.bio}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Added invitees */}
            {invitees.length > 0 && (
              <div className="space-y-2">
                {invitees.map((inv) => (
                  <div key={inv.user.id} className="bg-warm-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={inv.user.display_name} url={inv.user.avatar_url} size="sm" />
                        <span className="text-sm font-medium text-warm-800">{inv.user.display_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeInvitee(inv.user.id)}
                        className="text-warm-400 hover:text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={inv.context}
                      onChange={(e) => updateContext(inv.user.id, e.target.value)}
                      placeholder={`Why are you adding ${inv.user.display_name}? (optional)`}
                      maxLength={200}
                      className="w-full text-sm rounded-lg border border-warm-200 bg-white px-3 py-2 text-warm-900 placeholder:text-warm-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggested people */}
          {suggestedUsers.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-warm-500">Suggested based on helpful responses:</p>
              <div className="space-y-2">
                {suggestedUsers
                  .filter((u) => !invitees.some((i) => i.user.id === u.id))
                  .map((user) => (
                    <div key={user.id} className="bg-warm-50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.display_name} url={user.avatar_url} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-warm-800">{user.display_name}</p>
                          <p className="text-xs text-warm-400">Rated helpful {user.rating_count} time{user.rating_count !== 1 ? 's' : ''} by you</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addInvitee(user)}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        + Invite
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
