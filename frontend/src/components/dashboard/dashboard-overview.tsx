'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock3,
  type LucideIcon,
  Package2,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { AlertsDropdown } from '@/components/alerts/alerts-dropdown';
import { AuthSessionPanel } from '@/components/auth/auth-session-panel';
import { Button } from '@/components/ui/button';
import { ApiError, reportsApi } from '@/lib/api/api-client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type {
  DashboardRecentSale,
  DashboardReport,
  ExpiringProduct,
  InventoryReportProduct,
} from '@moul-hanout/shared-types';
import styles from './dashboard-overview.module.css';

const SALES_MIX_COLORS = ['#3f8e58', '#ccb28c', '#d9d4c6'] as const;
const EMPTY_SALES: DashboardRecentSale[] = [];
const EMPTY_INVENTORY: InventoryReportProduct[] = [];
const EMPTY_EXPIRING: ExpiringProduct[] = [];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCompactCurrency(amount: number) {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k MAD`;
  }

  return `${amount.toFixed(2)} MAD`;
}

function formatBusinessDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('fr-MA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatChartDay(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('fr-MA', {
    weekday: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatExpiryDate(value: string | null) {
  if (!value) {
    return 'Date indisponible';
  }

  return new Date(value).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'long',
  });
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Bonjour';
  }

  if (hour < 18) {
    return 'Bon apres-midi';
  }

  return 'Bonsoir';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getPaymentLabel(paymentMode: DashboardRecentSale['paymentMode']) {
  if (paymentMode === 'CARD') {
    return 'Carte';
  }

  if (paymentMode === 'OTHER') {
    return 'Autre';
  }

  return 'Especes';
}

function getStatusLabel(status: DashboardRecentSale['status']) {
  if (status === 'COMPLETED') {
    return 'Terminee';
  }

  if (status === 'CANCELLED') {
    return 'Annulee';
  }

  return 'En attente';
}

function getStockLabel(product: InventoryReportProduct) {
  const unitSuffix = product.unit ? ` ${product.unit}` : '';

  return `${product.currentStock}${unitSuffix} en stock | seuil ${product.lowStockThreshold}`;
}

function buildSalesMix(recentSales: DashboardRecentSale[]) {
  const totals = recentSales.reduce<Record<string, number>>((accumulator, sale) => {
    accumulator[sale.paymentMode] = (accumulator[sale.paymentMode] ?? 0) + sale.total;
    return accumulator;
  }, {});

  const source = [
    { label: 'Especes', value: totals.CASH ?? 0, color: SALES_MIX_COLORS[0] },
    { label: 'Carte', value: totals.CARD ?? 0, color: SALES_MIX_COLORS[1] },
    { label: 'Autre', value: totals.OTHER ?? 0, color: SALES_MIX_COLORS[2] },
  ].filter((entry) => entry.value > 0);

  if (source.length === 0) {
    return [];
  }

  const total = source.reduce((sum, entry) => sum + entry.value, 0);

  return source.map((entry) => ({
    ...entry,
    percent: Number(((entry.value / total) * 100).toFixed(1)),
  }));
}

function getDashboardErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Impossible de charger le tableau de bord pour le moment.';
}

function RevenueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string } }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const currentPoint = payload[0];

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{formatBusinessDate(currentPoint.payload.date)}</p>
      <div className={styles.tooltipValue}>{formatCurrency(currentPoint.value)}</div>
    </div>
  );
}

function MetricCardSkeleton() {
  return (
    <article className={styles.metricCard}>
      <span className={cn(styles.skeleton, styles.skeletonTitle)} aria-hidden="true" />
      <span className={cn(styles.skeleton, styles.skeletonValue)} aria-hidden="true" />
      <span className={cn(styles.skeleton, styles.skeletonLine)} aria-hidden="true" />
    </article>
  );
}

function PanelSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={cn(styles.skeleton, styles.panelSkeleton, tall && styles.panelSkeletonTall)}
      aria-hidden="true"
    />
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>
        <Icon size={20} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

function InventoryList({
  items,
  kind,
}: {
  items: InventoryReportProduct[] | ExpiringProduct[];
  kind: 'lowStock' | 'expiring';
}) {
  if (items.length === 0) {
    return kind === 'lowStock' ? (
      <EmptyState
        icon={Package2}
        title="Aucune reference en rupture proche"
        description="Le stock actif est au-dessus des seuils critiques pour le moment."
      />
    ) : (
      <EmptyState
        icon={Clock3}
        title="Aucune expiration proche"
        description="Aucun produit actif n'expire dans les 5 prochains jours."
      />
    );
  }

  return (
    <div className={styles.inventoryList}>
      {items.map((item) => (
        <article key={item.id} className={styles.inventoryRow}>
          <div className={styles.inventoryCopy}>
            <strong>{item.name}</strong>
            <span>{item.categoryName}</span>
          </div>
          <div className={styles.inventoryMeta}>
            <span>{getStockLabel(item)}</span>
            {kind === 'expiring' ? (
              <span className={styles.inventoryAccent}>
                Expire le {formatExpiryDate((item as ExpiringProduct).expirationDate)}
              </span>
            ) : (
              <span className={styles.inventoryAccent}>Reassort recommande</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [dashboard, setDashboard] = useState<DashboardReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const report = await reportsApi.dashboard();

        if (!isActive) {
          return;
        }

        setDashboard(report);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(getDashboardErrorMessage(error));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  const firstName = user?.name?.split(' ')[0] ?? 'gerant';
  const salesTrend = dashboard?.salesTrend ?? [];
  const lowStockProducts = dashboard?.lowStockProducts ?? EMPTY_INVENTORY;
  const expiringProducts = dashboard?.expiringProducts ?? EMPTY_EXPIRING;
  const recentSales = dashboard?.recentSales ?? EMPTY_SALES;
  const salesMix = useMemo(() => buildSalesMix(recentSales), [recentSales]);
  const recentSalesTotal = recentSales.reduce((sum, sale) => sum + sale.total, 0);
  const attentionCount = lowStockProducts.length + expiringProducts.length;

  const actionLinks = isOwner
    ? [
        { href: '/vente', label: 'Nouvelle vente', icon: ReceiptText, variant: 'default' as const },
        { href: '/inventaire', label: "Verifier l'inventaire", icon: Package2, variant: 'outline' as const },
        { href: '/rapports', label: 'Ouvrir les rapports', icon: TrendingUp, variant: 'outline' as const },
      ]
    : [
        { href: '/vente', label: 'Encaisser', icon: ReceiptText, variant: 'default' as const },
        { href: '/inventaire', label: 'Voir le stock', icon: Package2, variant: 'outline' as const },
        { href: '/profil', label: 'Mon profil', icon: ShieldCheck, variant: 'outline' as const },
      ];

  if (isLoading && !dashboard) {
    return (
      <main className={styles.dashboard}>
        <section className={styles.header}>
          <div className={styles.welcomeBlock}>
            <span className={styles.eyebrow}>Tableau de bord</span>
            <h1 className={styles.heading}>Chargement des indicateurs boutique</h1>
            <p className={styles.subtitle}>
              Les ventes, le stock et les alertes sont en cours de synchronisation.
            </p>
          </div>
        </section>

        <section className={styles.kpiGrid} aria-label="Chargement des indicateurs">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </section>

        <section className={styles.primaryGrid}>
          <div className={styles.card}>
            <PanelSkeleton tall />
          </div>
          <div className={styles.card}>
            <PanelSkeleton tall />
          </div>
        </section>

        <section className={styles.secondaryGrid}>
          <div className={styles.card}>
            <PanelSkeleton />
          </div>
          <div className={styles.card}>
            <PanelSkeleton />
          </div>
        </section>

        <section className={styles.card}>
          <PanelSkeleton tall />
        </section>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className={styles.dashboard}>
        <section className={styles.errorCard} role="alert">
          <span className={styles.errorIcon}>
            <AlertTriangle size={20} />
          </span>
          <div>
            <h1>Le tableau de bord est indisponible</h1>
            <p>{errorMessage ?? 'Une erreur est survenue pendant le chargement.'}</p>
          </div>
          <Button type="button" onClick={() => setReloadToken((value) => value + 1)} className={styles.retryButton}>
            <RefreshCcw size={16} />
            <span>Reessayer</span>
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.dashboard}>
      <section className={styles.header}>
        <div className={styles.welcomeBlock}>
          <span className={styles.eyebrow}>Tableau de bord</span>
          <h1 className={styles.heading}>
            {getGreeting()}, <span className={styles.headingAccent}>{firstName}</span>
          </h1>
          <p className={styles.subtitle}>
            Vue temps reel sur les ventes du jour, les produits a surveiller et les dernieres
            operations de la boutique.
          </p>

          <div className={styles.metaRow}>
            <span className={styles.metaPill}>
              <CalendarDays size={15} />
              {formatBusinessDate(dashboard.businessDate)}
            </span>
            <span className={styles.metaPill}>
              <ShieldCheck size={15} />
              {isOwner ? 'Espace proprietaire' : 'Espace caisse'}
            </span>
            <span
              className={cn(
                styles.metaPill,
                attentionCount > 0 ? styles.metaPillWarning : styles.metaPillSuccess,
              )}
            >
              <AlertTriangle size={15} />
              {attentionCount > 0
                ? `${attentionCount} point${attentionCount > 1 ? 's' : ''} a traiter`
                : 'Aucune alerte critique'}
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.utilityRow}>
            <AlertsDropdown compact />
            <Link href="/profil" className={styles.profileShortcut} aria-label="Ouvrir le profil">
              <span className={styles.profileShortcutAvatar}>{getInitials(user?.name ?? 'MH')}</span>
              <span className={styles.profileShortcutMeta}>
                <strong>{user?.name ?? 'Equipe boutique'}</strong>
                <span>{isOwner ? 'Proprietaire' : 'Caissier'}</span>
              </span>
            </Link>
          </div>

          <div className={styles.actionGroup}>
            {actionLinks.map((action) => (
              <Button
                key={action.href}
                asChild
                variant={action.variant}
                className={cn(
                  styles.actionButton,
                  action.variant === 'default' ? styles.actionPrimary : styles.actionSecondary,
                )}
              >
                <Link href={action.href}>
                  <action.icon size={16} />
                  <span>{action.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className={styles.banner} role="status">
          <div>
            <strong>Actualisation partielle</strong>
            <span>{errorMessage}</span>
          </div>
          <Button type="button" variant="ghost" onClick={() => setReloadToken((value) => value + 1)}>
            <RefreshCcw size={16} />
            <span>Recharger</span>
          </Button>
        </div>
      ) : null}

      <section className={styles.kpiGrid} aria-label="Indicateurs cles">
        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Ventes du jour</span>
            <span className={styles.metricIcon}>
              <TrendingUp size={18} />
            </span>
          </div>
          <strong className={styles.metricValue}>{formatCurrency(dashboard.dailySalesTotal)}</strong>
          <span className={styles.metricHint}>Encaissement confirme sur la journee en cours</span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Tickets aujourd&apos;hui</span>
            <span className={styles.metricIcon}>
              <ShoppingBag size={18} />
            </span>
          </div>
          <strong className={styles.metricValue}>
            {dashboard.dailySalesCount.toLocaleString('fr-MA')}
          </strong>
          <span className={styles.metricHint}>Nombre de ventes validees depuis l&apos;ouverture</span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Produits actifs</span>
            <span className={styles.metricIcon}>
              <Package2 size={18} />
            </span>
          </div>
          <strong className={styles.metricValue}>
            {dashboard.totalProducts.toLocaleString('fr-MA')}
          </strong>
          <span className={styles.metricHint}>References actuellement disponibles dans le catalogue</span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Stock bas</span>
            <span className={cn(styles.metricIcon, styles.metricIconWarning)}>
              <AlertTriangle size={18} />
            </span>
          </div>
          <strong className={styles.metricValue}>{lowStockProducts.length}</strong>
          <span className={styles.metricHint}>Produits au niveau ou sous le seuil de securite</span>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Expiration sous 5 jours</span>
            <span className={styles.metricIcon}>
              <Clock3 size={18} />
            </span>
          </div>
          <strong className={styles.metricValue}>{expiringProducts.length}</strong>
          <span className={styles.metricHint}>Lots a ecouler ou verifier rapidement</span>
        </article>
      </section>

      <section className={styles.primaryGrid}>
        <article className={cn(styles.card, styles.chartCard)}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Evolution des ventes</h2>
              <p>Chiffre d&apos;affaires journalier des 7 derniers jours.</p>
            </div>
            <span className={styles.rangePill}>7 jours</span>
          </div>

          {salesTrend.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Aucune vente recente"
              description="Le graphique apparaitra automatiquement des que des ventes seront enregistrees."
            />
          ) : (
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesTrend} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4b915b" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#4b915b" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDay}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#7b826f' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#7b826f' }}
                    tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                    width={48}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#d8dfd3', strokeDasharray: '3 4' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#357d4d"
                    fill="url(#dashboardRevenue)"
                    strokeWidth={2.5}
                    activeDot={{ r: 5, fill: '#357d4d', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className={cn(styles.card, styles.mixCard)}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Mix des paiements</h2>
              <p>Repartition calculee a partir des ventes recentes.</p>
            </div>
            <span className={styles.rangePill}>Dernieres ventes</span>
          </div>

          {salesMix.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="Pas encore de paiements a repartir"
              description="Le mix apparaitra automatiquement avec les prochaines ventes."
            />
          ) : (
            <>
              <div className={styles.mixVisual}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={salesMix}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="62%"
                      outerRadius="92%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {salesMix.map((slice) => (
                        <Cell key={slice.label} fill={slice.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.mixCenter}>
                  <strong>{formatCompactCurrency(recentSalesTotal)}</strong>
                  <span>Recent</span>
                </div>
              </div>

              <div className={styles.mixLegend}>
                {salesMix.map((slice) => (
                  <div key={slice.label} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{ backgroundColor: slice.color }} />
                    <span className={styles.legendLabel}>{slice.label}</span>
                    <span className={styles.legendValue}>{slice.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </section>

      <section className={styles.secondaryGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Produits a reassortir</h2>
              <p>References deja sous le seuil de stock defini.</p>
            </div>
            <Link href="/inventaire" className={styles.cardLink}>
              Ouvrir l&apos;inventaire <ArrowRight size={14} />
            </Link>
          </div>
          <InventoryList items={lowStockProducts} kind="lowStock" />
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Produits expirant bientot</h2>
              <p>Produits avec date d&apos;expiration dans les 5 prochains jours.</p>
            </div>
            <Link href="/inventaire" className={styles.cardLink}>
              Voir les details <ArrowRight size={14} />
            </Link>
          </div>
          <InventoryList items={expiringProducts} kind="expiring" />
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Ventes recentes</h2>
            <p>Dernieres ventes confirmees remontees par le point de vente.</p>
          </div>
          <Link href="/ventes" className={styles.cardLink}>
            Historique complet <ArrowRight size={14} />
          </Link>
        </div>

        {recentSales.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Aucune vente recente"
            description="Les nouvelles transactions apparaitront ici des qu'une vente sera encaissee."
          />
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Paiement</th>
                    <th>Caissier</th>
                    <th>Articles</th>
                    <th>Montant</th>
                    <th>Heure</th>
                    <th>Etat</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <Link href={`/ventes?receipt=${sale.receiptNumber}`} className={styles.invoiceLink}>
                          {sale.receiptNumber}
                        </Link>
                      </td>
                      <td>{getPaymentLabel(sale.paymentMode)}</td>
                      <td>{sale.cashierName}</td>
                      <td>{sale.itemCount}</td>
                      <td>{formatCurrency(sale.total)}</td>
                      <td>{formatDateTime(sale.soldAt)}</td>
                      <td>
                        <span className={styles.statusPill}>{getStatusLabel(sale.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.activityCards}>
              {recentSales.map((sale) => (
                <article key={sale.id} className={styles.activityCard}>
                  <div className={styles.activityCardHead}>
                    <Link href={`/ventes?receipt=${sale.receiptNumber}`} className={styles.invoiceLink}>
                      {sale.receiptNumber}
                    </Link>
                    <span className={styles.statusPill}>{getStatusLabel(sale.status)}</span>
                  </div>
                  <div className={styles.activityCardGrid}>
                    <span>{getPaymentLabel(sale.paymentMode)}</span>
                    <span>{sale.cashierName}</span>
                    <span>{sale.itemCount} articles</span>
                    <span>{formatDateTime(sale.soldAt)}</span>
                  </div>
                  <strong className={styles.activityCardAmount}>{formatCurrency(sale.total)}</strong>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {hasHydrated ? (
        <section className={cn(styles.card, styles.sessionCard)}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Session et acces</h2>
              <p>Controle rapide de la session active sans quitter le tableau de bord.</p>
            </div>
            <span className={styles.rangePill}>{isOwner ? 'Proprietaire' : 'Caissier'}</span>
          </div>
          <AuthSessionPanel />
        </section>
      ) : null}
    </main>
  );
}
