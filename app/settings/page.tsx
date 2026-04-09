'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import UtilityText from '@/components/UtilityText';

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name);
        setBio(data.bio || '');
        setNotificationEmail(data.notification_email || '');
        setNotificationsEnabled(data.notifications_enabled);
      }
    };
    fetchProfile();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        notification_email: notificationEmail.trim(),
        notifications_enabled: notificationsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-warm-900 mb-2">Settings</h1>
        <UtilityText className="mb-6">
          Manage your profile and notification preferences.
        </UtilityText>

        <form onSubmit={handleSave} className="space-y-6">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          <Textarea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A bit about you..."
            maxChars={160}
            charCount={bio.length}
            maxLength={160}
          />

          <Input
            label="Notification email"
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            required
          />

          <label className="flex items-center gap-2 text-sm text-warm-600 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="rounded border-warm-300 text-teal-600 focus:ring-teal-500"
            />
            Send me email notifications
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && <p className="text-sm text-green-600">Settings saved!</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>

        <div className="mt-12 pt-6 border-t border-warm-200">
          <Button variant="ghost" onClick={handleSignOut} className="text-red-500 hover:text-red-600">
            Sign out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
