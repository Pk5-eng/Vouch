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

  // IMPORTANT: call getUser() to refresh the session token.
  // The refreshed cookies are stored on supabaseResponse.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Helper: create a redirect that preserves Supabase session cookies
  function redirectTo(pathname: string, searchParams?: Record<string, string>) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    if (searchParams) {
      Object.entries(searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const redirectResponse = NextResponse.redirect(url);
    // Copy all Supabase session cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // Allow auth callback always
  if (path.startsWith('/auth/callback')) {
    return supabaseResponse;
  }

  // If logged in and visiting auth pages, redirect to feed
  if (user && path.startsWith('/auth')) {
    return redirectTo('/feed');
  }

  // Allow auth routes for unauthenticated users
  if (path.startsWith('/auth')) {
    return supabaseResponse;
  }

  // DEV BYPASS: skip auth — go straight to feed
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
