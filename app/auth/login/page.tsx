'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const next = searchParams.get('next');
    const callbackUrl = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <Card className="p-8">
      {sent ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-4">&#9993;</div>
          <h2 className="text-lg font-semibold text-warm-900 mb-2">Check your email</h2>
          <p className="text-warm-500 text-sm">
            We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
          </p>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            error={error}
          />
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Sending...' : 'Continue with email'}
          </Button>
          <p className="text-xs text-warm-400 text-center">
            We&apos;ll send you a magic link — no password needed.
          </p>
        </form>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-warm-900 mb-2">Vouch</h1>
          <p className="text-warm-500 text-lg leading-relaxed">
            In a world with a billion opinions,<br />filter the ones that matter.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-8 text-warm-400">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
