import type { Role } from '@moul-hanout/shared-types';

export const AUTH_ROUTES = ['/login', '/register'] as const;

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.includes(pathname as (typeof AUTH_ROUTES)[number]);
}

export function getPostLoginRedirect(_role: Role) {
  return '/';
}

export function getPostLogoutRedirect() {
  return '/login';
}
