import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];
const OWNER_ONLY_ROUTES = ['/reports', '/settings', '/users'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie (set after login via server action)
  const accessToken = request.cookies.get('mh-access-token')?.value;
  const userRole = request.cookies.get('mh-user-role')?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isOwnerRoute = OWNER_ONLY_ROUTES.some((r) => pathname.startsWith(r));

  // Logged-in users shouldn't access auth pages
  if (accessToken && isPublicRoute) {
    return NextResponse.redirect(new URL('/sales', request.url));
  }

  // Non-logged-in users can't access the app
  if (!accessToken && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cashiers can't access owner-only routes
  if (accessToken && isOwnerRoute && userRole !== 'OWNER') {
    return NextResponse.redirect(new URL('/sales', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes
     * - _next/static
     * - _next/image
     * - favicon
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
