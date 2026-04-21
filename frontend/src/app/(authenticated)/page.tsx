'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarDays,
  ClipboardList,
  ReceiptText,
  ShieldCheck,
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
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
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

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const firstName = user?.name?.split(' ')[0] ?? 'Gérant';
  const hasLowStock = !loading && !errorMessage && lowStockItems.length > 0;
  const topLowStockItems = lowStockItems.slice(0, 4);
  const roleLabel = user?.role === 'OWNER' ? 'Propriétaire' : 'Caissier';

  return (
    <main className="page stack app-page db-page">
      <section className="db-hero">
        <div className="db-hero__copy">
          <p className="db-hero__eyebrow">Poste de pilotage</p>
          <div className="db-hero__heading">
            <span className="db-hero__greeting">{getGreeting()}, {firstName}</span>
            <h1>Le magasin en direct, sans friction.</h1>
            <p>
              Suivez l&apos;activité du jour, gardez un œil sur le stock et lancez vos actions les plus
              fréquentes depuis une seule vue.
            </p>
          </div>

          <div className="db-hero__meta" aria-label="Contexte du tableau de bord">
            <span className="db-meta-pill">
              <CalendarDays size={14} />
              {formatDate()}
            </span>
            <span className="db-meta-pill">
              <ShieldCheck size={14} />
              {roleLabel}
            </span>
            <span className={`db-meta-pill${hasLowStock ? ' db-meta-pill--warn' : ''}`}>
              <ClipboardList size={14} />
              {loading ? 'Synchronisation…' : hasLowStock ? `${lowStockItems.length} priorités stock` : 'Stock stable'}
            </span>
          </div>

          <div className="db-hero__actions">
            <Link href="/vente" className="app-btn app-btn--primary db-hero__cta">
              <ShoppingCart size={16} />
              Ouvrir la caisse
            </Link>
            <Link href="/rapports" className="app-btn app-btn--ghost db-hero__secondary">
              Voir les rapports
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <aside className="db-pulse-card" aria-label="Pulse du jour">
          <div className="db-pulse-card__head">
            <span className="db-pulse-card__eyebrow">Pulse du jour</span>
            <span className="db-pulse-card__status">{loading ? 'Chargement' : 'En temps réel'}</span>
          </div>

          <div className="db-pulse-card__revenue">
            <span>Revenu encaissé</span>
            <strong>
              {loading
                ? '—'
                : errorMessage
                  ? '—'
                  : formatCurrency(summary?.totalRevenue ?? 0)}
            </strong>
          </div>

          <div className="db-pulse-card__metrics">
            <article>
              <span>Transactions</span>
              <strong>
                {loading
                  ? '—'
                  : errorMessage
                    ? '—'
                    : (summary?.transactionCount ?? 0)}
              </strong>
            </article>
            <article>
              <span>Stock faible</span>
              <strong>{loading ? '—' : errorMessage ? '—' : lowStockItems.length}</strong>
            </article>
            <article>
              <span>Mode</span>
              <strong>{roleLabel}</strong>
            </article>
          </div>

          <div className="db-pulse-card__bars" aria-hidden="true">
            <span className="db-pulse-card__bar db-pulse-card__bar--tall" />
            <span className="db-pulse-card__bar db-pulse-card__bar--mid" />
            <span className="db-pulse-card__bar db-pulse-card__bar--short" />
            <span className="db-pulse-card__bar db-pulse-card__bar--mid" />
            <span className="db-pulse-card__bar db-pulse-card__bar--tall" />
            <span className="db-pulse-card__bar db-pulse-card__bar--short" />
          </div>
        </aside>
      </section>

      {errorMessage ? (
        <div className="app-alert app-alert--danger" role="alert">
          <span className="app-alert__content">{errorMessage}</span>
          <button
            type="button"
            className="app-btn app-btn--secondary app-btn--sm"
            onClick={() => setReloadKey((count) => count + 1)}
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

      <div className="db-story-grid">
        <section className="db-actions-section panel" aria-label="Accès rapides">
          <div className="db-section-head">
            <div>
              <p className="db-section-title">Accès rapides</p>
              <h2 className="db-section-heading">Lancez les opérations clés</h2>
            </div>
            <span className="db-section-caption">Pensé pour les actions du quotidien</span>
          </div>

          <div className="db-actions-grid">
            <article className="db-action-card db-action-card--featured">
              <div className="db-action-card__icon">
                <ReceiptText size={22} />
              </div>
              <div className="db-action-card__body">
                <h3>Caisse</h3>
                <p>Démarrez une vente et encaissez les clients sans quitter le poste principal.</p>
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
                <p>Repérez vite les niveaux faibles et les références à surveiller.</p>
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
                    <p>Gardez les produits et catégories alignés avec l’activité du magasin.</p>
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
                    <p>Ajustez les accès du personnel et gardez le poste bien cadré.</p>
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

        <aside className={`db-stock-panel${hasLowStock ? ' db-stock-panel--warning' : ''}`}>
          <div className="db-stock-panel__head">
            <div>
              <p className="db-section-title">Radar stock</p>
              <h2 className="db-section-heading">
                {hasLowStock ? 'Réassort à enclencher' : 'État du rayon maîtrisé'}
              </h2>
            </div>
            <Link href="/inventaire" className="db-stock-panel__link">
              Ouvrir l&apos;inventaire
              <ArrowRight size={15} />
            </Link>
          </div>

          <p className="db-stock-panel__copy">
            {loading
              ? 'Analyse des niveaux de stock en cours.'
              : hasLowStock
                ? 'Les produits ci-dessous demandent une attention rapide pour éviter une rupture.'
                : 'Aucune alerte bloquante détectée pour le moment. Le stock est sous contrôle.'}
          </p>

          {loading ? (
            <div className="db-stock-panel__loading">
              <span className="db-kpi-skeleton" aria-hidden="true" />
              <span className="db-kpi-skeleton" aria-hidden="true" />
              <span className="db-kpi-skeleton" aria-hidden="true" />
            </div>
          ) : hasLowStock ? (
            <div className="db-stock-list" role="list" aria-label="Produits en stock faible">
              {topLowStockItems.map((item) => (
                <article key={item.id} className="db-stock-item" role="listitem">
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.categoryName}</p>
                  </div>
                  <div className="db-stock-item__stats">
                    <span>Actuel {item.currentStock}</span>
                    <span>Seuil {item.lowStockThreshold}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="db-stock-empty">
              <div className="db-stock-empty__badge">
                <ShieldCheck size={18} />
              </div>
              <div>
                <strong>Tout est aligné</strong>
                <p>Le magasin peut continuer son rythme sans action urgente côté stock.</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className="db-lower-grid">
        <section className="panel db-session-shell">
          <div className="db-section-head">
            <div>
              <p className="db-section-title">Sécurité & accès</p>
              <h2 className="db-section-heading">Session active</h2>
            </div>
            <span className="db-section-caption">Utilisateur actuellement connecté</span>
          </div>
          <AuthSessionPanel />
        </section>

        <OwnerQuickLinks />
      </div>
    </main>
  );
}
