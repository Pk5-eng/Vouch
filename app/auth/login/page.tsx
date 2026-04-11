'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const COOLDOWN_SECONDS = 60;

type AuthMode = 'password' | 'magic-link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [isSignUp, setIsSignUp] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handlePasswordAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Invalid email or password. If you don\u2019t have an account, click "Create account" below.');
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
      if (error.message.toLowerCase().includes('rate limit')) {
        setError('Too many attempts. Please wait a minute or use password sign-in instead.');
        setCooldown(COOLDOWN_SECONDS);
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
      <Card className="p-8">
        <div className="text-center py-4">
          <div className="text-4xl mb-4">&#9993;</div>
          <h2 className="text-lg font-semibold text-warm-900 mb-2">Check your email</h2>
          <p className="text-warm-500 text-sm">
            We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
          </p>
          <button
            type="button"
            className="mt-4 text-sm text-warm-400 hover:text-warm-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={cooldown > 0}
            onClick={() => { setSent(false); }}
          >
            {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Didn\u2019t get it? Resend'}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      {authMode === 'password' ? (
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
            placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Enter your password'}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Signing in...' : isSignUp ? 'Create account' : 'Sign in'}
          </Button>
          <p className="text-center text-sm text-warm-500">
            {isSignUp ? 'Already have an account?' : 'Don\u2019t have an account?'}{' '}
            <button
              type="button"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            >
              {isSignUp ? 'Sign in' : 'Create account'}
            </button>
          </p>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-warm-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-warm-400">or</span>
            </div>
          </div>
          <button
            type="button"
            className="w-full text-sm text-warm-500 hover:text-warm-700 transition-colors"
            onClick={() => { setAuthMode('magic-link'); setError(''); }}
          >
            Sign in with magic link instead
          </button>
        </form>
      ) : (
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
            We&apos;ll send you a magic link — no password needed.
          </p>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-warm-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-warm-400">or</span>
            </div>
          </div>
          <button
            type="button"
            className="w-full text-sm text-warm-500 hover:text-warm-700 transition-colors"
            onClick={() => { setAuthMode('password'); setError(''); }}
          >
            Sign in with password instead
          </button>
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
          <h1 className="text-3xl font-bold logo-gradient mb-2">Vouch</h1>
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
