'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-react';
import { AuthSessionPanel } from '@/components/auth/auth-session-panel';
import { OwnerQuickLinks } from '@/components/auth/owner-quick-links';
import { inventoryApi, salesApi } from '@/lib/api/api-client';
import type { DailySummary, InventoryItem } from '@moul-hanout/shared-types';
import { useAuthStore } from '@/store/auth.store';

function formatCurrency(amount: number) {
  return amount.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatDate() {
  return new Date().toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long' });
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

        if (!isMounted) return;

        setSummary(dailySummary);
        setLowStockItems(inventory.filter((item) => item.isLowStock));
      } catch {
        if (!isMounted) return;
        setSummary(null);
        setLowStockItems([]);
        setErrorMessage('Impossible de charger le tableau de bord pour le moment.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadDashboard();
    return () => { isMounted = false; };
  }, [reloadKey]);

  const firstName = user?.name?.split(' ')[0] ?? 'Gérant';
  const hasLowStock = !loading && !errorMessage && lowStockItems.length > 0;

  return (
    <main className="page stack app-page">

      {/* ── Welcome banner ── */}
      <div className="db-welcome">
        <div className="db-welcome__text">
          <span className="db-welcome__greeting">{getGreeting()}, {firstName}</span>
          <p className="db-welcome__date">{formatDate()}</p>
        </div>
        <Link href="/vente" className="app-btn db-welcome__cta">
          <ShoppingCart size={16} />
          Ouvrir la caisse
        </Link>
      </div>

      {/* ── Error / alerts ── */}
      {errorMessage ? (
        <div className="app-alert app-alert--danger" role="alert">
          <span className="app-alert__content">{errorMessage}</span>
          <button
            type="button"
            className="app-btn app-btn--secondary app-btn--sm"
            onClick={() => setReloadKey((c) => c + 1)}
          >
            Réessayer
          </button>
        </div>
      ) : null}

      {!alertDismissed && lowStockItems.length > 0 ? (
        <div className="app-alert app-alert--danger" role="alert">
          <span className="app-alert__content">
            <AlertTriangle size={16} />
            <strong>{lowStockItems.length} article{lowStockItems.length > 1 ? 's' : ''}</strong>{' '}
            en stock faible.{' '}
            <Link href="/inventaire" style={{ textDecoration: 'underline' }}>
              Voir l&apos;inventaire
            </Link>
          </span>
          <button
            type="button"
            className="app-alert__dismiss"
            onClick={() => setAlertDismissed(true)}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* ── KPI cards ── */}
      <section className="db-kpi-grid" aria-label="Indicateurs du jour">
        <article className="db-kpi-card">
          <div className="db-kpi-icon db-kpi-icon--green">
            <TrendingUp size={18} />
          </div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">Chiffre du jour</span>
            <strong className="db-kpi-value">
              {loading
                ? <span className="db-kpi-skeleton" aria-hidden="true" />
                : errorMessage
                  ? '—'
                  : formatCurrency(summary?.totalRevenue ?? 0)}
            </strong>
            <p className="db-kpi-hint">Revenu total encaissé aujourd&apos;hui</p>
          </div>
        </article>

        <article className="db-kpi-card">
          <div className="db-kpi-icon db-kpi-icon--blue">
            <ReceiptText size={18} />
          </div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">Transactions</span>
            <strong className="db-kpi-value">
              {loading
                ? <span className="db-kpi-skeleton" aria-hidden="true" />
                : errorMessage
                  ? '—'
                  : (summary?.transactionCount ?? 0)}
            </strong>
            <p className="db-kpi-hint">Ventes enregistrées aujourd&apos;hui</p>
          </div>
        </article>

        <article className={`db-kpi-card${hasLowStock ? ' db-kpi-card--warning' : ''}`}>
          <div className={`db-kpi-icon${hasLowStock ? ' db-kpi-icon--amber' : ' db-kpi-icon--green'}`}>
            <Warehouse size={18} />
          </div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">Stock faible</span>
            <strong className="db-kpi-value">
              {loading
                ? <span className="db-kpi-skeleton" aria-hidden="true" />
                : errorMessage
                  ? '—'
                  : lowStockItems.length}
            </strong>
            <p className="db-kpi-hint">
              {hasLowStock ? (
                <Link href="/inventaire" style={{ textDecoration: 'underline', color: 'inherit' }}>
                  Articles à réapprovisionner
                </Link>
              ) : (
                'Tous les articles sont en ordre'
              )}
            </p>
          </div>
        </article>
      </section>

      {/* ── Quick actions ── */}
      <section className="db-actions-section" aria-label="Accès rapides">
        <h2 className="db-section-title">Accès rapides</h2>
        <div className="db-actions-grid">
          <article className="db-action-card db-action-card--featured">
            <div className="db-action-card__icon">
              <ReceiptText size={22} />
            </div>
            <div className="db-action-card__body">
              <h3>Caisse</h3>
              <p>Démarrez une vente et encaissez les clients.</p>
            </div>
            <Link href="/vente" className="app-btn app-btn--primary">
              Ouvrir la caisse
              <ArrowRight size={15} />
            </Link>
          </article>

          <article className="db-action-card">
            <div className="db-action-card__icon">
              <Warehouse size={22} />
            </div>
            <div className="db-action-card__body">
              <h3>Stock</h3>
              <p>Consultez les ruptures et niveaux bas.</p>
            </div>
            <Link href="/inventaire" className="app-btn app-btn--secondary">
              Voir le stock
              <ArrowRight size={15} />
            </Link>
          </article>

          {user?.role === 'OWNER' ? (
            <>
              <article className="db-action-card">
                <div className="db-action-card__icon">
                  <Boxes size={22} />
                </div>
                <div className="db-action-card__body">
                  <h3>Catalogue</h3>
                  <p>Gérez les produits et catégories.</p>
                </div>
                <Link href="/produits" className="app-btn app-btn--secondary">
                  Gérer
                  <ArrowRight size={15} />
                </Link>
              </article>

              <article className="db-action-card">
                <div className="db-action-card__icon">
                  <Users size={22} />
                </div>
                <div className="db-action-card__body">
                  <h3>Équipe</h3>
                  <p>Gérez les accès du personnel.</p>
                </div>
                <Link href="/utilisateurs" className="app-btn app-btn--secondary">
                  Gérer
                  <ArrowRight size={15} />
                </Link>
              </article>
            </>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h2>Session active</h2>
        <AuthSessionPanel />
      </section>

      <OwnerQuickLinks />
    </main>
  );
}
