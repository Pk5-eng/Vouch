'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const COOLDOWN_SECONDS = 60;

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [showMagicLink, setShowMagicLink] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  // Pre-fill email if user visited before
  useEffect(() => {
    const savedEmail = localStorage.getItem('vouch-email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handlePasswordAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Remember email for next visit
    localStorage.setItem('vouch-email', email);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Wrong email or password. Need an account? Click "Create account".');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }
    }

    const next = searchParams.get('next') || '/feed';
    router.push(next);
  }, [email, password, isSignUp, searchParams, router, supabase.auth]);

  const handleMagicLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    setError('');

    localStorage.setItem('vouch-email', email);

    const next = searchParams.get('next');
    const callbackUrl = next
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
    });

    if (error) {
      if (error.message.toLowerCase().includes('rate limit')) {
        setError('Too many attempts. Use password sign-in instead.');
        setCooldown(COOLDOWN_SECONDS);
        setShowMagicLink(false);
      } else {
        setError(error.message);
      }
    } else {
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
    }
    setLoading(false);
  }, [cooldown, email, searchParams, supabase.auth]);

  if (sent) {
    return (
      <Card className="p-8 animate-fade-in-up">
        <div className="text-center py-4">
          <div className="text-5xl mb-4">&#9993;&#65039;</div>
          <h2 className="text-lg font-semibold text-warm-900 mb-2">Check your email</h2>
          <p className="text-warm-500 text-sm">
            We sent a magic link to <strong>{email}</strong>.<br />Click it to sign in instantly.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              className="text-sm text-warm-400 hover:text-warm-600 disabled:opacity-50"
              disabled={cooldown > 0}
              onClick={() => setSent(false)}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Didn\u2019t get it? Try again'}
            </button>
            <button
              type="button"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              onClick={() => { setSent(false); setShowMagicLink(false); }}
            >
              Use password instead
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (showMagicLink) {
    return (
      <Card className="p-8 animate-fade-in-up">
        <form onSubmit={handleMagicLink} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            error={error}
          />
          <Button type="submit" className="w-full" size="lg" disabled={loading || cooldown > 0}>
            {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send magic link'}
          </Button>
          <p className="text-xs text-warm-400 text-center">
            No password needed — we&apos;ll email you a sign-in link.
          </p>
          <button
            type="button"
            className="w-full text-sm text-warm-500 hover:text-warm-700 transition-colors"
            onClick={() => { setShowMagicLink(false); setError(''); }}
          >
            &larr; Back to password sign in
          </button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="p-8 animate-fade-in-up">
      <form onSubmit={handlePasswordAuth} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          error={error}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Your password'}
          required
          minLength={6}
        />
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (isSignUp ? 'Creating...' : 'Signing in...') : isSignUp ? 'Create account & enter' : 'Sign in'}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          >
            {isSignUp ? 'I have an account' : 'Create account'}
          </button>
          <button
            type="button"
            className="text-warm-400 hover:text-warm-600 transition-colors"
            onClick={() => { setShowMagicLink(true); setError(''); }}
          >
            Use magic link
          </button>
        </div>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold logo-gradient mb-3">Vouch</h1>
          <p className="text-warm-700 text-xl font-medium mb-2">Show up for others.</p>
          <p className="text-warm-500 text-sm leading-relaxed">
            Real questions, real experiences, from people who have been there.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-8 text-warm-400">Loading...</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-warm-400 mt-6">
          Your session stays active for 30 days — no repeat logins.
        </p>
      </div>
    </div>
  );
}
