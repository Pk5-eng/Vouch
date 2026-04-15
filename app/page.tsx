'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { createLocalUser, getLocalUser, syncAuthCookie } from '@/lib/local-auth';

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingUser, setCheckingUser] = useState(true);

  // Returning visitor? Drop them straight into the feed.
  useEffect(() => {
    const existing = getLocalUser();
    if (existing) {
      syncAuthCookie();
      router.replace('/feed');
      return;
    }
    setCheckingUser(false);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    createLocalUser({ email, password, name });
    router.replace('/feed');
  };

  if (checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-warm-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-5xl font-bold logo-gradient mb-3">Vouch</h1>
          <p className="text-2xl text-warm-700 font-medium mb-3">Show up for others.</p>
          <p className="text-warm-500 leading-relaxed max-w-sm mx-auto">
            Real questions from real lives. Experience-based responses from
            people who&apos;ve been there.
          </p>
        </div>

        <Card className="p-8 animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Chen"
              required
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min 6 chars)"
              minLength={6}
              required
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Setting up...' : 'Enter Vouch'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-warm-400 mt-6">
          We&apos;ll remember you on this device — no repeat logins.
        </p>
      </div>
    </div>
  );
}
