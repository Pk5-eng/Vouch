'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Card from '@/components/ui/Card';

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [bio, setBio] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setNotificationEmail(user.email);
      }
    };
    getUser();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email!,
      display_name: displayName.trim(),
      notification_email: notificationEmail.trim(),
      bio: bio.trim() || null,
      notifications_enabled: notificationsEnabled,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push('/feed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-warm-900 mb-3 leading-snug">
            &ldquo;In a world with a billion opinions,<br />filter the ones that matter.&rdquo;
          </h1>
          <p className="text-warm-500 leading-relaxed max-w-md mx-auto">
            Vouch is where real questions meet real experience. Ask what matters.
            Hear from people who&apos;ve been there. Build circles of people you actually trust.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Chen"
              required
              subtext="We encourage using your real name — it builds trust and helps others know who they're hearing from."
            />

            <div className="space-y-2">
              <Input
                label="Notification email"
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                required
                subtext="We'll send you a note when someone responds to your question or finds your experience helpful. Nothing else."
              />
              <label className="flex items-center gap-2 text-sm text-warm-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="rounded border-warm-300 text-teal-600 focus:ring-teal-500"
                />
                Send me notifications
              </label>
            </div>

            <Textarea
              label="A bit about you"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Product designer, career changer, figuring things out one question at a time"
              maxChars={160}
              charCount={bio.length}
              maxLength={160}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Setting up...' : 'Enter Vouch'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
