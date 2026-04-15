import { NextResponse, type NextRequest } from 'next/server';

/**
 * Prototype middleware.
 *
 * Auth is bypassed for the prototype — we read a lightweight cookie
 * (`vouch-local-uid`) that the client sets after the onboarding form.
 * The middleware only decides:
 *   - signed-in users visiting `/` → go straight to `/feed`
 *   - anonymous users visiting a gated route → send to `/` (onboarding)
 *
 * No Supabase, no session refresh, no network calls.
 */

const AUTH_COOKIE = 'vouch-local-uid';

// Public routes that never require onboarding to have been completed.
const PUBLIC_PATHS = ['/'];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasUser = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  // The old Supabase /auth/* routes are dead in prototype mode — bounce
  // everyone back to the onboarding landing (or feed if already signed in).
  if (path === '/auth' || path.startsWith('/auth/')) {
    const url = request.nextUrl.clone();
    url.pathname = hasUser ? '/feed' : '/';
    return NextResponse.redirect(url);
  }

  // Old /onboarding page (Supabase-based) is replaced by the landing form.
  if (path === '/onboarding' || path.startsWith('/onboarding/')) {
    const url = request.nextUrl.clone();
    url.pathname = hasUser ? '/feed' : '/';
    return NextResponse.redirect(url);
  }

  // Signed-in user hitting the landing page → drop them straight into the feed.
  if (hasUser && path === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/feed';
    return NextResponse.redirect(url);
  }

  // Anonymous user on a gated route → send them to the onboarding landing.
  if (!hasUser && !isPublicPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
