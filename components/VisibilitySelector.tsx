'use client';

import RadioCard from './ui/RadioCard';
import type { Visibility, TrustGroup } from '@/lib/types';

interface VisibilitySelectorProps {
  value: Visibility;
  onChange: (value: Visibility) => void;
  selectedGroupId: string | null;
  onGroupChange: (groupId: string) => void;
  userGroups: TrustGroup[];
}

export default function VisibilitySelector({
  value,
  onChange,
  selectedGroupId,
  onGroupChange,
  userGroups,
}: VisibilitySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-warm-800">
        Who should see this?
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <RadioCard
          selected={value === 'global'}
          onClick={() => onChange('global')}
          icon="&#127760;"
          title="Everyone"
          description="Visible on the global feed. Your name is visible."
          isDefault
        />
        <RadioCard
          selected={value === 'trust_group'}
          onClick={() => onChange('trust_group')}
          icon="&#128101;"
          title="Huddle"
          description="Only members of a huddle you choose. Your name visible to them."
        />
        <RadioCard
          selected={value === 'veiled'}
          onClick={() => onChange('veiled')}
          icon="&#128100;"
          title="Veiled"
          description="Everyone can see this but won't know it's you."
        />
      </div>

      {value === 'trust_group' && (
        <div className="mt-3">
          {userGroups.length > 0 ? (
            <select
              value={selectedGroupId || ''}
              onChange={(e) => onGroupChange(e.target.value)}
              className="w-full rounded-lg border border-warm-200 bg-white px-3.5 py-2.5 text-warm-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Choose a group</option>
              {userGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-warm-500">
              You haven&apos;t created a huddle yet.{' '}
              <a href="/groups/create" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Create one now
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
