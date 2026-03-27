'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { logoutCurrentSession } from '@/lib/auth/auth-actions';
import { getPostLogoutRedirect } from '@/lib/auth/auth-routes';
import { useAuthStore } from '@/store/auth.store';

export function AuthSessionPanel() {
  const router = useRouter();
  const { hasHydrated, isAuthenticated, user } = useAuthStore((state) => ({
    hasHydrated: state.hasHydrated,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logoutCurrentSession();
      router.replace(getPostLogoutRedirect());
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (!hasHydrated) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
        Restoring your session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-slate-700">
        <p className="font-semibold text-slate-900">You are not signed in.</p>
        <p className="mt-1 text-sm">Use the login page to start an authenticated session.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-slate-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.14em] text-emerald-700">Active Session</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{user.name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {user.email} · Role: {user.role}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}
