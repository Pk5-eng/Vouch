import Link from 'next/link';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import type { Question } from '@/lib/types';

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

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const isVeiled = question.is_veiled;
  const authorName = isVeiled ? 'A verified member' : (question.author?.display_name || 'Anonymous');
  const contextLabel = question.trust_group?.name || null;

  return (
    <Link href={`/question/${question.id}`}>
      <div className="bg-white rounded-xl border border-warm-100 p-5 hover:border-warm-200 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            name={authorName}
            url={isVeiled ? null : question.author?.avatar_url}
            size="sm"
            veiled={isVeiled}
          />
          <div className="flex items-center gap-1.5 text-sm text-warm-500 min-w-0">
            <span className="font-medium text-warm-700 truncate">{authorName}</span>
            {contextLabel && (
              <>
                <span>&middot;</span>
                <span className="truncate text-teal-600">{contextLabel}</span>
              </>
            )}
            <span>&middot;</span>
            <span className="whitespace-nowrap">{timeAgo(question.created_at)}</span>
          </div>
        </div>

        <h3 className="text-warm-900 font-medium leading-snug mb-3 line-clamp-2">
          {question.title}
        </h3>

        <div className="flex items-center gap-2 text-sm">
          <Badge variant={question.category === 'emotional' ? 'veiled' : 'default'}>
            {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
          </Badge>
          <span className="text-warm-400">&middot;</span>
          <span className="text-warm-400">
            {question.response_count || 0} {(question.response_count || 0) === 1 ? 'response' : 'responses'}
          </span>
          {question.status === 'resolved' && (
            <>
              <span className="text-warm-400">&middot;</span>
              <Badge variant="resolved">&#10003; Resolved</Badge>
            </>
          )}
        </div>

        {question.status === 'resolved' && question.outcome_text && (
          <p className="mt-3 text-sm text-warm-500 line-clamp-2 bg-green-50 rounded-lg p-3">
            <span className="font-medium text-green-700">Outcome:</span>{' '}
            {question.outcome_text}
          </p>
        )}
      </div>
    </Link>
  );
}
