import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { AuthResponse, AuthTokens, AuthUser } from '@moul-hanout/shared-types';
import { setTokens, clearTokens } from '../lib/api/api-client';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  // Actions
  login: (auth: AuthResponse) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        hasHydrated: false,

        login(auth) {
          const tokens: AuthTokens = {
            accessToken: auth.accessToken,
            refreshToken: auth.refreshToken,
          };

          setTokens(tokens); // Sync to API client
          set({
            user: auth.user,
            accessToken: auth.accessToken,
            refreshToken: auth.refreshToken,
            isAuthenticated: true,
          });
        },

        logout() {
          clearTokens();
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        },

        updateUser(partial) {
          set((state) => ({
            user: state.user ? { ...state.user, ...partial } : null,
          }));
        },

        setHydrated(value) {
          set({ hasHydrated: value });
        },
      }),
      {
        name: 'moul-hanout-auth',
        onRehydrateStorage: () => (state) => {
          const tokens =
            state?.accessToken && state?.refreshToken
              ? {
                  accessToken: state.accessToken,
                  refreshToken: state.refreshToken,
                }
              : null;

          if (tokens) {
            setTokens(tokens);
          } else {
            clearTokens();
          }

          state?.setHydrated(true);
        },
        // Only persist tokens and user — don't persist the whole state
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
