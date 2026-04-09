'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import ResponseCard from '@/components/ResponseCard';
import UtilityText from '@/components/UtilityText';
import type { Question, Response } from '@/lib/types';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function QuestionDetailPage() {
  const params = useParams();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [experience, setExperience] = useState('');
  const [takeaway, setTakeaway] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [revealedTo, setRevealedTo] = useState<Set<string>>(new Set());
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    // Fetch question
    const { data: q } = await supabase
      .from('questions')
      .select(`
        *,
        author:users!questions_author_id_fkey(*),
        trust_group:trust_groups(*)
      `)
      .eq('id', questionId)
      .single();

    if (q) {
      // Strip author data from veiled questions for privacy
      if (q.is_veiled && user?.id !== q.author_id) {
        q.author = undefined;
      }
      setQuestion(q as unknown as Question);
    }

    // Fetch responses with authors
    const { data: resps } = await supabase
      .from('responses')
      .select(`
        *,
        author:users!responses_author_id_fkey(*)
      `)
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });

    if (resps && user) {
      // Check which responses the user has rated
      const { data: ratings } = await supabase
        .from('helpfulness_ratings')
        .select('response_id')
        .eq('rated_by', user.id);

      const ratedIds = new Set(ratings?.map((r) => r.response_id) || []);

      setResponses(
        resps.map((r) => ({
          ...r,
          user_has_rated: ratedIds.has(r.id),
        })) as Response[]
      );
    } else {
      setResponses((resps || []) as Response[]);
    }
  }, [supabase, questionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (experience.trim().length < 100) {
      setError('Please share at least 100 characters about your experience.');
      return;
    }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setSubmitting(false); return; }

    const { error: insertError } = await supabase.from('responses').insert({
      question_id: questionId,
      author_id: user.id,
      experience: experience.trim(),
      takeaway: takeaway.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    // Note: question's updated_at is automatically bumped by a DB trigger on response insert
    // This powers the activity-weighted recency feed sort

    // Notify question author
    if (question && question.author_id !== user.id) {
      const { data: profile } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', user.id)
        .single();

      await supabase.from('notifications').insert({
        user_id: question.author_id,
        type: 'new_response',
        title: `${profile?.display_name || 'Someone'} shared their experience`,
        body: `On your question: "${question.title.slice(0, 80)}"`,
        link: `/question/${questionId}`,
      });
    }

    setExperience('');
    setTakeaway('');
    setSubmitting(false);
    fetchData();
  };

  const handleReveal = async (responderId: string) => {
    if (revealedTo.has(responderId)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !question) return;

    const { data: profile } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Notify the responder that the asker revealed their identity
    await supabase.from('notifications').insert({
      user_id: responderId,
      type: 'vouch_received',
      title: `${profile?.display_name || 'Someone'} revealed themselves to you`,
      body: `They asked: "${question.title.slice(0, 80)}"`,
      link: `/question/${questionId}`,
    });

    setRevealedTo((prev) => new Set(prev).add(responderId));
  };

  if (!question) {
    return <AppShell><div className="text-center py-12 text-warm-400">Loading...</div></AppShell>;
  }

  const isVeiled = question.is_veiled;
  const authorName = isVeiled ? 'A verified member' : (question.author?.display_name || 'Anonymous');
  const isOwnQuestion = currentUserId === question.author_id;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Question */}
        <div className="bg-white rounded-xl border border-warm-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Avatar
              name={authorName}
              url={isVeiled ? null : question.author?.avatar_url}
              veiled={isVeiled}
            />
            <div className="text-sm text-warm-500">
              {!isVeiled ? (
                <Link href={`/profile/${question.author_id}`} className="font-medium text-warm-700 hover:text-teal-600">
                  {authorName}
                </Link>
              ) : (
                <span className="font-medium text-warm-700">{authorName}</span>
              )}
              {question.trust_group && (
                <span className="text-teal-600"> &middot; {question.trust_group.name}</span>
              )}
              <span> &middot; {timeAgo(question.created_at)}</span>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-warm-900 mb-3 leading-snug">
            {question.title}
          </h1>

          {question.context && (
            <p className="text-warm-600 leading-relaxed mb-4 whitespace-pre-wrap">
              {question.context}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge>{question.category.charAt(0).toUpperCase() + question.category.slice(1)}</Badge>
            <span className="text-warm-400 text-sm">&middot; {responses.length} {responses.length === 1 ? 'response' : 'responses'}</span>
            {question.status === 'resolved' && <Badge variant="resolved">&#10003; Resolved</Badge>}
          </div>

          {/* Outcome */}
          {question.status === 'resolved' && question.outcome_text && (
            <div className="mt-4 bg-green-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5">Outcome</p>
              <p className="text-warm-800 text-sm leading-relaxed whitespace-pre-wrap">{question.outcome_text}</p>
              {question.outcome_at && (
                <p className="text-xs text-warm-400 mt-2">{timeAgo(question.outcome_at)}</p>
              )}
            </div>
          )}

          {/* Close the loop button for question author */}
          {isOwnQuestion && question.status === 'open' && responses.length > 0 && (
            <div className="mt-4">
              <Link href={`/question/${questionId}/outcome`}>
                <Button variant="secondary" size="sm">Share what happened</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Responses */}
        <UtilityText>
          Respond with what you&apos;ve actually been through. Specific experiences help more than general advice.
        </UtilityText>

        {responses.length > 0 && (
          <div className="space-y-4">
            {responses.map((r) => (
              <ResponseCard
                key={r.id}
                response={r}
                currentUserId={currentUserId}
                questionAuthorId={question.author_id}
                isVeiledQuestion={isVeiled}
                onReveal={handleReveal}
                revealedTo={revealedTo}
              />
            ))}
          </div>
        )}

        {/* Response form */}
        {!isOwnQuestion && (
          <div className="bg-white rounded-xl border border-warm-100 p-6">
            <h3 className="font-semibold text-warm-800 mb-4">Share your experience</h3>
            <form onSubmit={handleSubmitResponse} className="space-y-4">
              <Textarea
                label="What's your relevant experience?"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Share what you went through. Be specific — it helps more than general advice."
                maxChars={2000}
                charCount={experience.length}
                maxLength={2000}
                subtext={`Minimum 100 characters${experience.length > 0 ? ` · ${experience.length}/100` : ''}`}
              />

              <Textarea
                label="What did you learn from it? (optional)"
                value={takeaway}
                onChange={(e) => setTakeaway(e.target.value)}
                placeholder='If you could tell your past self one thing about this...'
                maxChars={500}
                charCount={takeaway.length}
                maxLength={500}
              />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting || experience.trim().length < 100}>
                  {submitting ? 'Sharing...' : 'Share Experience'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
