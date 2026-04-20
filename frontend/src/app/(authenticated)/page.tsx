'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { AuthSessionPanel } from '@/components/auth/auth-session-panel';
import { OwnerQuickLinks } from '@/components/auth/owner-quick-links';
import { inventoryApi, salesApi } from '@/lib/api/api-client';
import type { DailySummary, InventoryItem } from '@moul-hanout/shared-types';

function formatCurrency(amount: number) {
  return amount.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';
}

export default function HomePage() {
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
        title="Gestion simple du magasin"
        subtitle="Retrouvez vos espaces principaux en un seul endroit pour suivre le stock, organiser le catalogue et gerer l&apos;equipe sans complexite."
        actions={
          <Link href="/inventaire" className="button-link">
            Ouvrir l&apos;inventaire
          </Link>
        }
      />

      {errorMessage ? (
        <div className="app-alert app-alert--danger" role="alert">
          <span style={{ flex: 1 }}>{errorMessage}</span>
          <button type="button" className="button-link" onClick={() => setReloadKey((current) => current + 1)}>
            Reessayer
          </button>
        </div>
      ) : null}

      {!alertDismissed && lowStockItems.length > 0 ? (
        <div className="app-alert app-alert--danger" role="alert">
          <span style={{ flex: 1 }}>
            <strong>{lowStockItems.length} article{lowStockItems.length > 1 ? 's' : ''}</strong> en stock faible.{' '}
            <Link href="/inventaire" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Voir l&apos;inventaire
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setAlertDismissed(true)}
            aria-label="Fermer"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              lineHeight: 1,
              padding: 0,
              color: 'inherit',
            }}
          >
            x
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

      <section className="panel">
        <h2>Session active</h2>
        <AuthSessionPanel />
      </section>

      <OwnerQuickLinks />
    </main>
  );
}
