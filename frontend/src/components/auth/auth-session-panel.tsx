'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { logoutCurrentSession } from '@/lib/auth/auth-actions';
import { getPostLogoutRedirect } from '@/lib/auth/auth-routes';
import { useAuthStore } from '@/store/auth.store';

export function AuthSessionPanel() {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
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
      <div className="app-card px-5 py-4 text-sm text-[var(--text-soft)]">
        Restauration de votre session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="app-card px-5 py-4 text-slate-700">
        <p className="font-semibold text-slate-900">Aucune session active.</p>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Connectez-vous pour acceder au tableau de bord et aux outils du magasin.
        </p>
      </div>
    );
  }

  return (
    <div className="app-card px-5 py-5 text-slate-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.14em] text-[var(--primary)]">Session active</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{user.name}</h3>
          <p className="mt-1 text-sm text-[var(--text-soft)]">
            {user.email} | {user.role === 'OWNER' ? 'Proprietaire' : 'Caissier'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="app-btn app-btn--primary"
        >
          {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          <span>{isLoggingOut ? 'Deconnexion...' : 'Se deconnecter'}</span>
        </button>
      </div>
    </div>
  );
}
