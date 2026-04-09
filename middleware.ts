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
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Allow auth callback always
  if (path.startsWith('/auth/callback')) {
    return supabaseResponse;
  }

  // If logged in and visiting auth pages, redirect to feed
  if (user && path.startsWith('/auth')) {
    const url = request.nextUrl.clone();
    url.pathname = '/feed';
    return NextResponse.redirect(url);
  }

  // Allow auth routes for unauthenticated users
  if (path.startsWith('/auth')) {
    return supabaseResponse;
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (!user && path !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    // Preserve the intended destination so we can redirect after login
    if (path !== '/feed') {
      url.searchParams.set('next', path);
    }
    return NextResponse.redirect(url);
  }

  // If logged in, check if onboarded
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    // Not onboarded yet — redirect to onboarding (unless already there)
    if (!profile && path !== '/onboarding') {
      const url = request.nextUrl.clone();
      // Preserve the next param through onboarding
      const next = request.nextUrl.searchParams.get('next') || (path !== '/' && path !== '/feed' ? path : null);
      url.pathname = '/onboarding';
      if (next) url.searchParams.set('next', next);
      return NextResponse.redirect(url);
    }

    // Already onboarded but visiting onboarding — redirect to feed
    if (profile && path === '/onboarding') {
      const url = request.nextUrl.clone();
      url.pathname = '/feed';
      return NextResponse.redirect(url);
    }

    // Logged in and at root — redirect to feed
    if (profile && path === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/feed';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
