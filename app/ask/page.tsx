'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import PillSelect from '@/components/ui/PillSelect';
import VisibilitySelector from '@/components/VisibilitySelector';
import UtilityText from '@/components/UtilityText';
import { CATEGORIES, type Visibility, type TrustGroup } from '@/lib/types';

export default function AskPage() {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('global');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<TrustGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchGroups = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberships } = await supabase
        .from('trust_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberships?.length) {
        const groupIds = memberships.map((m) => m.group_id);
        const { data: groups } = await supabase
          .from('trust_groups')
          .select('*')
          .in('id', groupIds);
        if (groups) setUserGroups(groups as TrustGroup[]);
      }
    };
    fetchGroups();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Please enter your question.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    if (visibility === 'trust_group' && !groupId) { setError('Please select a trust group.'); return; }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { data, error: insertError } = await supabase.from('questions').insert({
      author_id: user.id,
      title: title.trim(),
      context: context.trim() || null,
      category,
      visibility,
      trust_group_id: visibility === 'trust_group' ? groupId : null,
      is_veiled: visibility === 'veiled',
    }).select('id').single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Notify trust group members if trust_group visibility
    if (visibility === 'trust_group' && groupId) {
      const { data: members } = await supabase
        .from('trust_group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .neq('user_id', user.id);

      if (members) {
        const { data: profile } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', user.id)
          .single();

        const { data: group } = await supabase
          .from('trust_groups')
          .select('name')
          .eq('id', groupId)
          .single();

        const notifications = members.map((m) => ({
          user_id: m.user_id,
          type: 'group_question' as const,
          title: `New question in ${group?.name || 'your group'}`,
          body: `${profile?.display_name || 'Someone'} asked: "${title.trim().slice(0, 80)}"`,
          link: `/question/${data.id}`,
        }));

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }
    }

    router.push(`/question/${data.id}`);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Ask a question</h1>
        <UtilityText className="mb-6">
          The best questions are specific and honest. Share what you&apos;re actually trying to figure out — you&apos;ll get better responses.
        </UtilityText>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              label="What are you trying to figure out?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Has anyone switched from engineering to product management in their third year?"
              maxLength={200}
              required
            />
            <p className="text-xs text-warm-400 text-right mt-1">{title.length}/200</p>
          </div>

          <Textarea
            label="What context would help someone respond?"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. I'm a CS junior, love building products but feeling burnt out on pure coding..."
            maxChars={1000}
            charCount={context.length}
            maxLength={1000}
            subtext="The more context you share, the more relevant responses you'll get."
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-warm-800">
              What area is this about?
            </label>
            <PillSelect
              options={CATEGORIES}
              value={category}
              onChange={setCategory}
            />
          </div>

          <VisibilitySelector
            value={visibility}
            onChange={setVisibility}
            selectedGroupId={groupId}
            onGroupChange={setGroupId}
            userGroups={userGroups}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Posting...' : 'Ask'}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
