'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export function OwnerQuickLinks() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);

  if (!hasHydrated || user?.role !== 'OWNER') {
    return null;
  }

  return (
    <section className="panel">
      <h2>Owner sections</h2>
      <nav className="flex flex-wrap gap-3" aria-label="Owner sections">
        <Link href="/produits" className="button-link secondary">
          Produits
        </Link>
        <Link href="/utilisateurs" className="button-link secondary">
          Utilisateurs
        </Link>
      </nav>
    </section>
  );
}
