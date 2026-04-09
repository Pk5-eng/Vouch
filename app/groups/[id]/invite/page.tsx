'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import UtilityText from '@/components/UtilityText';
import type { User, TrustGroup } from '@/lib/types';

export default function InvitePage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [group, setGroup] = useState<TrustGroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [vouchContext, setVouchContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingMemberIds, setExistingMemberIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchGroup = async () => {
      const { data } = await supabase
        .from('trust_groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (data) setGroup(data as TrustGroup);

      const { data: members } = await supabase
        .from('trust_group_members')
        .select('user_id')
        .eq('group_id', groupId);
      if (members) setExistingMemberIds(new Set(members.map((m) => m.user_id)));
    };
    fetchGroup();
  }, [supabase, groupId]);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim().length < 2) { setSearchResults([]); return; }

      const { data } = await supabase
        .from('users')
        .select('*')
        .ilike('display_name', `%${searchQuery}%`)
        .limit(5);

      setSearchResults(
        (data || []).filter((u) => !existingMemberIds.has(u.id)) as User[]
      );
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase, existingMemberIds]);

  const handleInvite = async () => {
    if (!selectedUser) { setError('Please select a person to invite.'); return; }
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { error: insertError } = await supabase.from('trust_group_members').insert({
      group_id: groupId,
      user_id: selectedUser.id,
      role: 'member',
      vouch_context: vouchContext.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Send notification
    const { data: profile } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    await supabase.from('notifications').insert({
      user_id: selectedUser.id,
      type: 'group_invite',
      title: `${profile?.display_name || 'Someone'} invited you to "${group?.name}"`,
      body: vouchContext.trim() ? `They said: "${vouchContext.trim()}"` : null,
      link: `/groups/${groupId}`,
    });

    router.push(`/groups/${groupId}`);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">
          Invite to {group?.name || 'group'}
        </h1>
        <UtilityText className="mb-6">
          Invite someone whose experience and judgment you value.
        </UtilityText>

        <div className="space-y-6">
          <Input
            label="Search for someone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
          />

          {searchResults.length > 0 && !selectedUser && (
            <div className="bg-white border border-warm-200 rounded-lg divide-y divide-warm-100">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => { setSelectedUser(user); setSearchQuery(''); setSearchResults([]); }}
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

          {selectedUser && (
            <div className="bg-warm-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedUser.display_name} url={selectedUser.avatar_url} size="sm" />
                  <span className="text-sm font-medium text-warm-800">{selectedUser.display_name}</span>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-sm text-warm-400 hover:text-red-500"
                >
                  Change
                </button>
              </div>
              <Input
                label={`Why are you inviting ${selectedUser.display_name}?`}
                value={vouchContext}
                onChange={(e) => setVouchContext(e.target.value)}
                placeholder="What do they bring to this group? (optional)"
                maxLength={200}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button onClick={handleInvite} disabled={loading || !selectedUser} size="lg">
            {loading ? 'Inviting...' : 'Send Invite'}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
