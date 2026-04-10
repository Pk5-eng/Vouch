'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Banner from './ui/Banner';
import Button from './ui/Button';

export default function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('vouch-welcome-dismissed');
    if (!wasDismissed) setDismissed(false);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('vouch-welcome-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <Banner onDismiss={handleDismiss}>
      <h3 className="text-lg font-semibold text-warm-900 mb-2">Welcome to Vouch</h3>
      <p className="text-sm text-warm-600 leading-relaxed mb-4">
        This is the global feed — real questions from real people.
        Browse, respond with your experience, or ask your own question.
      </p>
      <p className="text-sm text-warm-600 leading-relaxed mb-4">
        When you&apos;re ready, create a Huddle — a small circle of
        people whose judgment you value — to ask the questions that
        matter most to you.
      </p>
      <div className="flex gap-3">
        <Link href="/ask">
          <Button size="sm">Ask Your First Question</Button>
        </Link>
        <Link href="/groups/create">
          <Button variant="secondary" size="sm">Create a Huddle</Button>
        </Link>
      </div>
    </Banner>
  );
}
