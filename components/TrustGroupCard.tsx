import Link from 'next/link';
import type { TrustGroup } from '@/lib/types';

interface TrustGroupCardProps {
  group: TrustGroup & { member_count?: number; latest_question?: string; latest_question_time?: string };
}

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

export default function TrustGroupCard({ group }: TrustGroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <div className="bg-white rounded-xl border border-warm-100 p-4 hover:border-warm-200 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">&#128101;</span>
          <span className="font-medium text-warm-800 text-sm">{group.name}</span>
          <span className="text-warm-400 text-sm">&middot;</span>
          <span className="text-warm-400 text-sm">{group.member_count || 0} members</span>
        </div>
        {group.latest_question && (
          <p className="text-sm text-warm-500 truncate mt-1">
            Latest: &ldquo;{group.latest_question}&rdquo;
          </p>
        )}
        {group.latest_question_time && (
          <p className="text-xs text-warm-400 mt-0.5">{timeAgo(group.latest_question_time)}</p>
        )}
      </div>
    </Link>
  );
}
