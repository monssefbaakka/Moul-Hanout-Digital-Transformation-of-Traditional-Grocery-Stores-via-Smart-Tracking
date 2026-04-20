'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Boxes, ReceiptText, Users, Warehouse } from 'lucide-react';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { AuthSessionPanel } from '@/components/auth/auth-session-panel';
import { OwnerQuickLinks } from '@/components/auth/owner-quick-links';
import { inventoryApi, salesApi } from '@/lib/api/api-client';
import type { DailySummary, InventoryItem } from '@moul-hanout/shared-types';
import { useAuthStore } from '@/store/auth.store';

function formatCurrency(amount: number) {
  return amount.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';
}

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [dailySummary, inventory] = await Promise.all([
          salesApi.dailySummary(),
          inventoryApi.list(),
        ]);

        if (!isMounted) {
          return;
        }

        setSummary(dailySummary);
        setLowStockItems(inventory.filter((item) => item.isLowStock));
      } catch {
        if (!isMounted) {
          return;
        }

        setSummary(null);
        setLowStockItems([]);
        setErrorMessage('Impossible de charger le tableau de bord pour le moment.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  return (
    <main className="page stack app-page">
      <AppPageHeader
        title="Tableau de bord du magasin"
        subtitle="Suivez les performances du jour, surveillez les priorites et ouvrez rapidement les espaces importants de l'application."
        actions={
          <Link href="/inventaire" className="app-btn app-btn--primary">
            Ouvrir l&apos;inventaire
          </Link>
        }
      />

      {errorMessage ? (
        <div className="app-alert app-alert--danger" role="alert">
          <span className="app-alert__content">{errorMessage}</span>
          <button
            type="button"
            className="app-btn app-btn--secondary"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            Reessayer
          </button>
        </div>
      ) : null}

      {!alertDismissed && lowStockItems.length > 0 ? (
        <div className="app-alert app-alert--danger" role="alert">
          <span className="app-alert__content">
            <AlertTriangle size={18} />
            <strong>{lowStockItems.length} article{lowStockItems.length > 1 ? 's' : ''}</strong> en stock faible.{' '}
            <Link href="/inventaire" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Voir l&apos;inventaire
            </Link>
          </span>
          <button
            type="button"
            className="app-alert__dismiss"
            onClick={() => setAlertDismissed(true)}
            aria-label="Fermer"
          >
            Fermer
          </button>
        </div>
      ) : null}

      <section className="app-dashboard-grid">
        <article className="panel app-stat-card">
          <span className="eyebrow">Chiffre du jour</span>
          <strong>{loading ? '...' : errorMessage ? '--' : formatCurrency(summary?.totalRevenue ?? 0)}</strong>
          <p>{errorMessage ? 'Rechargez pour recuperer les donnees du jour.' : 'Revenu total encaisse aujourd&apos;hui.'}</p>
        </article>

        <article className="panel app-stat-card">
          <span className="eyebrow">Transactions</span>
          <strong>{loading ? '...' : errorMessage ? '--' : (summary?.transactionCount ?? 0)}</strong>
          <p>{errorMessage ? 'Le total des ventes du jour est indisponible.' : 'Nombre de ventes enregistrees aujourd&apos;hui.'}</p>
        </article>

        <article className="panel app-stat-card">
          <span className="eyebrow">Stock faible</span>
          <strong>{loading ? '...' : errorMessage ? '--' : lowStockItems.length}</strong>
          <p>
            {errorMessage ? (
              'L etat du stock n a pas pu etre charge.'
            ) : lowStockItems.length > 0 ? (
              <Link href="/inventaire" style={{ color: 'inherit', textDecoration: 'underline' }}>
                Article{lowStockItems.length > 1 ? 's' : ''} a reapprovisionner
              </Link>
            ) : (
              'Tous les articles sont bien approvisionnes.'
            )}
          </p>
        </article>
      </section>

      <section className="dashboard-action-grid" aria-label="Acces rapides">
        <article className="app-card dashboard-action-card">
          <span className="dashboard-action-card__icon">
            <ReceiptText size={20} />
          </span>
          <div>
            <h2>Caisse</h2>
            <p>Lancez une nouvelle vente et encaissez rapidement les clients du magasin.</p>
          </div>
          <Link href="/vente" className="app-btn app-btn--primary">
            Ouvrir la caisse
            <ArrowRight size={16} />
          </Link>
        </article>

        <article className="app-card dashboard-action-card">
          <span className="dashboard-action-card__icon">
            <Warehouse size={20} />
          </span>
          <div>
            <h2>Surveillance stock</h2>
            <p>Consultez les ruptures, les seuils bas et les produits a surveiller.</p>
          </div>
          <Link href="/inventaire" className="app-btn app-btn--secondary">
            Voir le stock
            <ArrowRight size={16} />
          </Link>
        </article>

        {user?.role === 'OWNER' ? (
          <>
            <article className="app-card dashboard-action-card">
              <span className="dashboard-action-card__icon">
                <Boxes size={20} />
              </span>
              <div>
                <h2>Catalogue</h2>
                <p>Ajoutez des produits, structurez les categories et gardez le catalogue propre.</p>
              </div>
              <Link href="/produits" className="app-btn app-btn--secondary">
                Gerer le catalogue
                <ArrowRight size={16} />
              </Link>
            </article>

            <article className="app-card dashboard-action-card">
              <span className="dashboard-action-card__icon">
                <Users size={20} />
              </span>
              <div>
                <h2>Equipe</h2>
                <p>Donnez les bons acces au personnel et desactivez les comptes inactifs.</p>
              </div>
              <Link href="/utilisateurs" className="app-btn app-btn--secondary">
                Ouvrir les utilisateurs
                <ArrowRight size={16} />
              </Link>
            </article>
          </>
        ) : null}
      </section>

      <section className="panel">
        <h2>Session active</h2>
        <AuthSessionPanel />
      </section>

      <OwnerQuickLinks />
    </main>
  );
}
