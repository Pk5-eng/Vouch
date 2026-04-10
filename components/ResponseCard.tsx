'use client';

import { useState } from 'react';
import Avatar from './ui/Avatar';
import { createClient } from '@/lib/supabase';
import type { Response } from '@/lib/types';

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

interface ResponseCardProps {
  response: Response;
  currentUserId: string;
  questionAuthorId: string;
  isVeiledQuestion?: boolean;
  onReveal?: (responderId: string) => void;
  revealedTo?: Set<string>;
}

export default function ResponseCard({
  response,
  currentUserId,
  questionAuthorId,
  isVeiledQuestion,
  onReveal,
  revealedTo,
}: ResponseCardProps) {
  const [hasRated, setHasRated] = useState(response.user_has_rated || false);
  const [isRating, setIsRating] = useState(false);

  const supabase = createClient();

  const handleRate = async () => {
    if (isRating || response.author_id === currentUserId) return;
    setIsRating(true);

    if (hasRated) {
      await supabase
        .from('helpfulness_ratings')
        .delete()
        .eq('response_id', response.id)
        .eq('rated_by', currentUserId);
      setHasRated(false);
    } else {
      await supabase.from('helpfulness_ratings').insert({
        response_id: response.id,
        rated_by: currentUserId,
        is_from_asker: currentUserId === questionAuthorId,
      });
      setHasRated(true);

      // Create notification for the responder
      if (response.author_id !== currentUserId) {
        await supabase.from('notifications').insert({
          user_id: response.author_id,
          type: 'marked_helpful',
          title: 'Someone found your experience helpful',
          body: `Your response was marked as helpful.`,
          link: `/question/${response.question_id}`,
        });
      }
    }
    setIsRating(false);
  };

  const isOwnResponse = response.author_id === currentUserId;
  const isQuestionAuthor = currentUserId === questionAuthorId;

  return (
    <div className="bg-white rounded-xl border border-warm-100 p-5">
      <div className="flex items-center gap-3 mb-4">
        <Avatar
          name={response.author?.display_name || 'User'}
          url={response.author?.avatar_url}
          size="sm"
        />
        <div className="flex items-center gap-1.5 text-sm text-warm-500">
          <span className="font-medium text-warm-700">
            {response.author?.display_name || 'User'}
          </span>
          <span>&middot;</span>
          <span>{timeAgo(response.created_at)}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-1.5">
            Their Experience
          </p>
          <p className="text-warm-800 leading-relaxed whitespace-pre-wrap">
            {response.experience}
          </p>
        </div>

        {response.takeaway && (
          <div>
            <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider mb-1.5">
              What They Learned
            </p>
            <p className="text-warm-800 leading-relaxed whitespace-pre-wrap">
              {response.takeaway}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          {isVeiledQuestion && isQuestionAuthor && (
            revealedTo?.has(response.author_id) ? (
              <span className="text-xs text-green-600 font-medium">
                Identity revealed to {response.author?.display_name}
              </span>
            ) : (
              <button
                onClick={() => onReveal?.(response.author_id)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Reveal yourself to {response.author?.display_name}
              </button>
            )
          )}
        </div>

        {!isOwnResponse && (
          <button
            onClick={handleRate}
            disabled={isRating}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              hasRated
                ? 'text-red-500'
                : 'text-warm-400 hover:text-red-400'
            }`}
          >
            <span className="text-lg">{hasRated ? '♥' : '♡'}</span>
            <span>This helped</span>
          </button>
        )}
      </div>
    </div>
  );
}
