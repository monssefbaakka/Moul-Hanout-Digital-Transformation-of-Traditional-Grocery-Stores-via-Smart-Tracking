import type { Role } from '@moul-hanout/shared-types';

/**
 * Routes that are considered "auth pages".
 * Authenticated users visiting these are redirected to their dashboard.
 * Unauthenticated users visiting any other route are redirected to /login.
 */
export const AUTH_ROUTES = ['/login', '/forgot-password'] as const;

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

export function getPostLoginRedirect(role: Role) {
  // Both OWNER and CASHIER land on / for now.
  // Expand here when owner-dashboard and cashier-pos routes are built.
  switch (role) {
    case 'OWNER':
      return '/dashboard';
    case 'CASHIER':
      return '/pos';
    default:
      return '/';
  }
}

export function getPostLogoutRedirect() {
  return '/login';
}
