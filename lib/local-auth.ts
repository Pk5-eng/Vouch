/**
 * Lightweight local "auth" for prototype mode.
 *
 * Bypasses Supabase auth entirely. Stores the user in localStorage
 * (client-side persistence) and mirrors the id into a cookie so the
 * Next.js middleware can gate routes without a round-trip to Supabase.
 *
 * Not secure. Not meant for production — just enough to let returning
 * visitors skip the onboarding form and drop straight into the feed.
 */

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

const STORAGE_KEY = 'vouch-local-user';
export const AUTH_COOKIE = 'vouch-local-uid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function randomId(): string {
  // Small UUID-ish id. Good enough for a prototype.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getLocalUser(): LocalUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalUser;
    if (!parsed?.id || !parsed?.email || !parsed?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createLocalUser(input: { email: string; password: string; name: string }): LocalUser {
  const user: LocalUser = {
    id: randomId(),
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    // Passwords are intentionally not persisted — this is a prototype shim.
    setCookie(AUTH_COOKIE, user.id, COOKIE_MAX_AGE);
  }
  return user;
}

export function clearLocalUser(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  clearCookie(AUTH_COOKIE);
}

/**
 * Ensures the auth cookie stays in sync with localStorage on every page load.
 * Call this once on the client after hydration.
 */
export function syncAuthCookie(): void {
  if (typeof window === 'undefined') return;
  const user = getLocalUser();
  if (user) {
    setCookie(AUTH_COOKIE, user.id, COOKIE_MAX_AGE);
  } else {
    clearCookie(AUTH_COOKIE);
  }
}
