import type { AuthResponse, LogoutResponse } from '@moul-hanout/shared-types';
import { authApi } from '@/lib/api/api-client';
import { useAuthStore } from '@/store/auth.store';

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const auth = await authApi.login(email, password);
  useAuthStore.getState().login(auth);
  return auth;
}

export async function logoutCurrentSession(): Promise<LogoutResponse> {
  const { logout } = useAuthStore.getState();

  try {
    const result = await authApi.logout();
    logout();
    return result;
  } catch (error) {
    logout();
    throw error;
  }
}

export function restorePersistedAuth() {
  return useAuthStore.getState();
}
