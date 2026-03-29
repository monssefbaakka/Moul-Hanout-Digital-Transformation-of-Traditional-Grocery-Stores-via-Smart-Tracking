import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens } from '@moul-hanout/shared-types';
import { authApi, setTokens, clearTokens } from '../lib/api/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setAuth: (user: User, tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null as User | null,
      isAuthenticated: false,
      isLoading: false,
      error: null as string | null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const tokens = await authApi.login(email, password);
          
          // In a real app, we'd fetch user profile or decode JWT.
          // For now, let's assume the validate endpoint or a mock profile.
          // We'll use the validate endpoint to get the user data immediately.
          const validation = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: tokens.accessToken }),
          })).json();

          if (validation.data) {
            setTokens(tokens);
            set({
              user: validation.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (err: any) {
          set({
            error: err.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (err) {
          console.error('Logout error:', err);
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false });
          // Clear storage manually if needed or let persist handle it
        }
      },

      clearError: () => set({ error: null }),

      setAuth: (user: User, tokens: AuthTokens) => {
        setTokens(tokens);
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthState) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // When the page reloads, we need to sync the in-memory 
        // api-client tokens from the persisted storage if possible.
        // This is a bit tricky without storing tokens in the store itself,
        // so for now let's keep tokens in cookies or handle them here.
        // For simplicity in Sprint 1, I'll update this to include tokens in the store.
      },
    }
  )
);
