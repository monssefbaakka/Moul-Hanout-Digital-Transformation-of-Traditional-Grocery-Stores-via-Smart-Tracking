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
      <h2>Raccourcis proprietaire</h2>
      <p>
        Accedez rapidement aux espaces de configuration les plus utilises pour garder le magasin a jour.
      </p>
      <nav className="app-quick-links" aria-label="Raccourcis proprietaire">
        <Link href="/categories" className="button-link secondary">
          Categories
        </Link>
        <Link href="/inventaire" className="button-link secondary">
          Inventaire
        </Link>
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
