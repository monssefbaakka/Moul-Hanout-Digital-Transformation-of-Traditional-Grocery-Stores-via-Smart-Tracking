import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected Route Middleware
 *
 * Rules:
 *   1. Unauthenticated user  →  visiting a protected route  →  redirect /login
 *   2. Authenticated user    →  visiting an auth page       →  redirect their dashboard
 *
 * Auth state is stored in localStorage by Zustand persist under the key
 * "moul-hanout-auth". Middleware runs on the Edge, which has no access to
 * localStorage, so we read the persisted JSON from the cookie fallback that
 * Next.js middleware CAN access — or, more precisely, we rely on the cookie
 * that the storageEventPlugin would set, but since Zustand uses localStorage
 * by default we use a lightweight cookie written by the client on login/logout.
 *
 * @see /src/store/auth.store.ts  (sets the cookie on login/logout)
 * @see /src/lib/auth/auth-routes.ts
 */

/** Routes that do NOT require authentication. */
const PUBLIC_ROUTES = ['/login', '/forgot-password'];

/** Routes that the auth middleware should skip entirely (Next.js internals, assets). */
function isStaticOrInternal(pathname: string) {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // static files like favicon.ico, robots.txt, etc.
  );
}

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Read the authentication flag from the cookie written by the auth store.
 * Cookie name: "mh-auth" — value: "1" when logged in, absent or "0" when not.
 */
function isAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get('mh-auth');
  return cookie?.value === '1';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static assets
  if (isStaticOrInternal(pathname)) {
    return NextResponse.next();
  }

  const authed = isAuthenticated(request);

  // Rule 1: Unauthenticated user visiting a protected route → /login
  if (!authed && !isPublicRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Preserve the original destination so we can redirect back after login
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rule 2: Authenticated user visiting an auth page → their home
  if (authed && isPublicRoute(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

/** Only run the middleware on pages, not on static files or API routes */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
