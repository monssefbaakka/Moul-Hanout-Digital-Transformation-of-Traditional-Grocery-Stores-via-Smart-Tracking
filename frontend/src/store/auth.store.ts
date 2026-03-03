import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User, AuthTokens } from '@moul-hanout/shared-types';
import { setTokens, clearTokens } from '../lib/api/api-client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,

        login(user, tokens) {
          setTokens(tokens); // Sync to API client
          set({
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
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
      }),
      {
        name: 'moul-hanout-auth',
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
