import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/feed');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-warm-50 px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-warm-900 mb-4">Vouch</h1>
        <p className="text-xl text-warm-600 leading-relaxed mb-2">
          In a world with a billion opinions,<br />filter the ones that matter.
        </p>
        <p className="text-warm-400 mb-8 max-w-md mx-auto">
          Real questions from real lives. Experience-based responses from people who&apos;ve been there.
          Build trust circles for the questions that matter most.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center px-8 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors text-lg"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
