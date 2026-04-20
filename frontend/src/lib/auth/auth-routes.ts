import type { Role } from '@moul-hanout/shared-types';

/**
 * Routes that are publicly reachable without an authenticated session.
 */
export const AUTH_ROUTES = ['/login', '/forgot-password', '/reset-password'] as const;

/**
 * Routes that should redirect authenticated users away.
 * `/reset-password` stays accessible so email links still work for signed-in users.
 */
export const GUEST_ONLY_ROUTES = ['/login', '/forgot-password'] as const;

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

export function isGuestOnlyRoute(pathname: string) {
  return GUEST_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}

export function getPostLoginRedirect(role: Role) {
  switch (role) {
    case 'OWNER':
      return '/';
    case 'CASHIER':
      return '/inventaire';
    default:
      return '/';
  }
}

export function getPostLogoutRedirect() {
  return '/login';
}
