'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import UtilityText from '@/components/UtilityText';
import type { Response } from '@/lib/types';

export default function OutcomePage() {
  const params = useParams();
  const questionId = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [outcomeText, setOutcomeText] = useState('');
  const [responses, setResponses] = useState<Response[]>([]);
  const [thankedIds, setThankedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResponses = async () => {
      const { data } = await supabase
        .from('responses')
        .select(`*, author:users!responses_author_id_fkey(*)`)
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });

      if (data) setResponses(data as Response[]);
    };
    fetchResponses();
  }, [supabase, questionId]);

  const toggleThank = (responseId: string) => {
    setThankedIds((prev) => {
      const next = new Set(prev);
      if (next.has(responseId)) next.delete(responseId);
      else next.add(responseId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeText.trim()) { setError('Please share what you ended up doing.'); return; }
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    // Update question with outcome
    const { error: updateError } = await supabase
      .from('questions')
      .update({
        status: 'resolved',
        outcome_text: outcomeText.trim(),
        outcome_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .eq('author_id', user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Create gratitude notes for all thanked responders (even without a note)
    for (const responseId of thankedIds) {
      const note = notes[responseId]?.trim() || '';
      await supabase.from('gratitude_notes').insert({
        response_id: responseId,
        from_user_id: user.id,
        note,
      });
    }

    // Notify responders
    const { data: profile } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const { data: question } = await supabase
      .from('questions')
      .select('title')
      .eq('id', questionId)
      .single();

    const responderIds = [...new Set(responses.map((r) => r.author_id))].filter((id) => id !== user.id);

    const notifications = responderIds.map((responderId) => ({
      user_id: responderId,
      type: 'outcome_posted' as const,
      title: `${profile?.display_name || 'Someone'} closed the loop`,
      body: `On: "${question?.title?.slice(0, 80) || 'a question you responded to'}"`,
      link: `/question/${questionId}`,
    }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    router.push(`/question/${questionId}`);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Close the loop</h1>
        <UtilityText className="mb-6">
          Closing the loop helps everyone — it shows what happened and lets you thank the people who showed up.
        </UtilityText>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Textarea
            label="What did you end up doing?"
            value={outcomeText}
            onChange={(e) => setOutcomeText(e.target.value)}
            placeholder="Share what you decided and how it's going..."
            maxChars={1000}
            charCount={outcomeText.length}
            maxLength={1000}
            required
          />

          {responses.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-warm-800">
                Did anyone&apos;s response particularly help?
              </label>
              {responses.map((r) => (
                <div key={r.id} className="bg-warm-50 rounded-lg p-4 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={thankedIds.has(r.id)}
                      onChange={() => toggleThank(r.id)}
                      className="rounded border-warm-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-warm-800">
                      {r.author?.display_name || 'Anonymous'}
                    </span>
                  </label>
                  {thankedIds.has(r.id) && (
                    <input
                      type="text"
                      value={notes[r.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                      placeholder="Optional private thank-you note..."
                      maxLength={200}
                      className="w-full text-sm rounded-lg border border-warm-200 bg-white px-3 py-2 text-warm-900 placeholder:text-warm-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Closing the loop...' : 'Close the loop'}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
