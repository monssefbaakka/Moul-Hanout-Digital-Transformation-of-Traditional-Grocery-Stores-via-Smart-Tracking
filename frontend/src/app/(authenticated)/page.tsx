'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import { AuthSessionPanel } from '@/components/auth/auth-session-panel';
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

type StockLevel = 'critical' | 'low' | 'ok';

function getStockLevel(current: number, threshold: number): StockLevel {
  if (threshold > 0 && current <= threshold * 0.5) return 'critical';
  if (current <= threshold) return 'low';
  return 'ok';
}

function StockBar({ current, threshold }: { current: number; threshold: number }) {
  const pct = threshold > 0 ? Math.min(100, Math.round((current / threshold) * 100)) : 100;
  const level = getStockLevel(current, threshold);

  return (
    <div className="db2-stock-bar">
      <div className={`db2-stock-bar__fill db2-stock-bar__fill--${level}`} style={{ width: `${pct}%` }} />
    </div>
  );
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
  const topLowStockItems = lowStockItems.slice(0, 5);
  const roleLabel = user?.role === 'OWNER' ? 'Propriétaire' : 'Caissier';

  return (
    <main className="page stack app-page db2-page">

      {/* ── Command Bar ─────────────────────────────────── */}
      <section className="db2-command">
        <div className="db2-command__left">
          <p className="db2-command__eyebrow">Poste de pilotage</p>
          <h1 className="db2-command__greeting">
            {getGreeting()},&nbsp;<span>{firstName}</span>
          </h1>
          <div className="db2-command__chips">
            <span className="db2-chip">
              <CalendarDays size={13} />
              {formatDate()}
            </span>
            <span className="db2-chip">
              <ShieldCheck size={13} />
              {roleLabel}
            </span>
            <span className={`db2-chip${hasLowStock ? ' db2-chip--warn' : ''}`}>
              {hasLowStock ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />}
              {loading
                ? 'Synchronisation…'
                : hasLowStock
                  ? `${lowStockItems.length} alerte${lowStockItems.length > 1 ? 's' : ''} stock`
                  : 'Stock stable'}
            </span>
          </div>
        </div>

        <div className="db2-command__right">
          <Link href="/vente" className="db2-command__cta">
            <ReceiptText size={17} />
            Ouvrir la caisse
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── Alerts ──────────────────────────────────────── */}
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

      {/* ── KPI Strip ───────────────────────────────────── */}
      <section className="db2-kpi-strip" aria-label="Indicateurs du jour">

        <article className="db2-kpi">
          <div className="db2-kpi__accent db2-kpi__accent--green" />
          <div className="db2-kpi__icon db2-kpi__icon--green">
            <TrendingUp size={16} />
          </div>
          <div className="db2-kpi__body">
            <span className="db2-kpi__label">Chiffre du jour</span>
            <strong className="db2-kpi__value">
              {loading
                ? <span className="db-kpi-skeleton" aria-hidden="true" />
                : errorMessage
                  ? '—'
                  : formatCurrency(summary?.totalRevenue ?? 0)}
            </strong>
            <p className="db2-kpi__hint">Revenu total encaissé aujourd&apos;hui</p>
          </div>
        </article>

        <article className="db2-kpi">
          <div className="db2-kpi__accent db2-kpi__accent--blue" />
          <div className="db2-kpi__icon db2-kpi__icon--blue">
            <ReceiptText size={16} />
          </div>
          <div className="db2-kpi__body">
            <span className="db2-kpi__label">Transactions</span>
            <strong className="db2-kpi__value">
              {loading
                ? <span className="db-kpi-skeleton" aria-hidden="true" />
                : errorMessage
                  ? '—'
                  : (summary?.transactionCount ?? 0)}
            </strong>
            <p className="db2-kpi__hint">Ventes enregistrées aujourd&apos;hui</p>
          </div>
        </article>

        <article className={`db2-kpi${hasLowStock ? ' db2-kpi--warn' : ''}`}>
          <div className={`db2-kpi__accent${hasLowStock ? ' db2-kpi__accent--amber' : ' db2-kpi__accent--green'}`} />
          <div className={`db2-kpi__icon${hasLowStock ? ' db2-kpi__icon--amber' : ' db2-kpi__icon--green'}`}>
            <Warehouse size={16} />
          </div>
          <div className="db2-kpi__body">
            <span className="db2-kpi__label">Stock faible</span>
            <strong className="db2-kpi__value">
              {loading
                ? <span className="db-kpi-skeleton" aria-hidden="true" />
                : errorMessage
                  ? '—'
                  : lowStockItems.length}
            </strong>
            <p className="db2-kpi__hint">
              {hasLowStock ? (
                <Link href="/inventaire" className="db2-kpi__hint-link">
                  Articles à réapprovisionner →
                </Link>
              ) : (
                'Tous les articles sont en ordre'
              )}
            </p>
          </div>
        </article>

      </section>

      {/* ── Main Grid ───────────────────────────────────── */}
      <div className="db2-main-grid">

        {/* Stock Radar */}
        <section
          className={`db2-radar${hasLowStock ? ' db2-radar--warn' : ''}`}
          aria-label="Radar stock"
        >
          <div className="db2-radar__head">
            <div>
              <p className="db2-eyebrow">Radar stock</p>
              <h2 className="db2-radar__title">
                {hasLowStock ? 'Réassort requis' : 'Tous les rayons sont approvisionnés'}
              </h2>
            </div>
            <Link href="/inventaire" className="db2-radar__link">
              Inventaire complet <ArrowRight size={14} />
            </Link>
          </div>

          <p className="db2-radar__copy">
            {loading
              ? 'Analyse des niveaux de stock en cours…'
              : hasLowStock
                ? 'Les articles ci-dessous ont atteint leur seuil critique et nécessitent un réassort.'
                : "Aucune alerte détectée. Le stock est maîtrisé pour continuer l'activité normalement."}
          </p>

          {loading ? (
            <div className="db2-radar__skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="db2-radar__skeleton-row">
                  <span className="db-kpi-skeleton" style={{ width: '45%', height: '1rem' }} aria-hidden="true" />
                  <span className="db-kpi-skeleton" style={{ width: '65%', height: '6px' }} aria-hidden="true" />
                </div>
              ))}
            </div>
          ) : hasLowStock ? (
            <div className="db2-stock-list" role="list" aria-label="Produits en stock faible">
              {topLowStockItems.map((item) => {
                const level = getStockLevel(item.currentStock, item.lowStockThreshold);
                return (
                  <article key={item.id} className="db2-stock-item" role="listitem">
                    <div className="db2-stock-item__meta">
                      <span className={`db2-stock-item__dot db2-stock-item__dot--${level}`} aria-hidden="true" />
                      <div className="db2-stock-item__text">
                        <strong>{item.name}</strong>
                        <span>{item.categoryName}</span>
                      </div>
                    </div>
                    <div className="db2-stock-item__gauge">
                      <StockBar current={item.currentStock} threshold={item.lowStockThreshold} />
                      <div className="db2-stock-item__counts">
                        <span className="db2-stock-item__current">{item.currentStock}</span>
                        <span className="db2-stock-item__threshold">&nbsp;/ {item.lowStockThreshold}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
              {lowStockItems.length > 5 ? (
                <Link href="/inventaire" className="db2-stock-more">
                  +{lowStockItems.length - 5} autres articles <ArrowRight size={13} />
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="db2-stock-ok">
              <div className="db2-stock-ok__badge">
                <ShieldCheck size={20} />
              </div>
              <div>
                <strong>Stock maîtrisé</strong>
                <p>Continuez votre rythme sans action urgente côté stock.</p>
              </div>
            </div>
          )}
        </section>

        {/* Pulse Metrics */}
        <aside className="db2-pulse" aria-label="Métriques du jour">
          <div className="db2-pulse__head">
            <p className="db2-eyebrow" style={{ color: 'rgba(197,237,218,0.72)' }}>Pulse du jour</p>
            <span className="db2-pulse__live">
              {loading ? 'Chargement' : 'En direct'}
            </span>
          </div>

          <div className="db2-pulse__revenue">
            <span>Revenu encaissé</span>
            <strong>
              {loading
                ? '—'
                : errorMessage
                  ? '—'
                  : formatCurrency(summary?.totalRevenue ?? 0)}
            </strong>
          </div>

          <div className="db2-pulse__stats">
            <div className="db2-pulse__stat">
              <span>Transactions</span>
              <strong>{loading ? '—' : errorMessage ? '—' : (summary?.transactionCount ?? 0)}</strong>
            </div>
            <div className="db2-pulse__stat">
              <span>Alertes stock</span>
              <strong>{loading ? '—' : errorMessage ? '—' : lowStockItems.length}</strong>
            </div>
            <div className="db2-pulse__stat">
              <span>Rôle actif</span>
              <strong>{roleLabel}</strong>
            </div>
          </div>

          <div className="db2-pulse__bars" aria-hidden="true">
            {(
              [
                { h: '3.2rem' },
                { h: '2.1rem' },
                { h: '2.8rem' },
                { h: '1.5rem' },
                { h: '3.5rem' },
                { h: '2.4rem' },
                { h: '1.8rem' },
              ] as { h: string }[]
            ).map((bar, i) => (
              <span
                key={i}
                className="db2-pulse__bar"
                style={{ '--bar-h': bar.h } as React.CSSProperties}
              />
            ))}
          </div>
        </aside>

      </div>

      {/* ── Session Strip ───────────────────────────────── */}
      <section className="db2-session-strip panel">
        <div className="db2-section-label">Sécurité &amp; accès</div>
        <AuthSessionPanel />
      </section>

    </main>
  );
}
