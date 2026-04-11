import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Keep user signed in for 30 days
              maxAge: 60 * 60 * 24 * 30,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          );
        },
      },
    }
  );

  // Refresh session token — the updated cookies are written to supabaseResponse.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  function redirectTo(pathname: string, searchParams?: Record<string, string>) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    if (searchParams) {
      Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // Always allow auth callback
  if (path.startsWith('/auth/callback')) {
    return supabaseResponse;
  }

  // Logged-in user visiting auth pages → go to feed
  if (user && path.startsWith('/auth')) {
    return redirectTo('/feed');
  }

  // Allow auth routes for unauthenticated users
  if (path.startsWith('/auth')) {
    return supabaseResponse;
  }

  // Not logged in → redirect to login
  if (!user) {
    if (path === '/') {
      return redirectTo('/auth/login');
    }
    const params: Record<string, string> = {};
    if (path !== '/feed') params.next = path;
    return redirectTo('/auth/login', params);
  }

  // Logged in — check onboarding
  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile && path !== '/onboarding') {
    const next = path !== '/' && path !== '/feed' ? path : null;
    const params: Record<string, string> = {};
    if (next) params.next = next;
    return redirectTo('/onboarding', params);
  }

  if (profile && path === '/onboarding') {
    return redirectTo('/feed');
  }

  if (path === '/') {
    return redirectTo('/feed');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
