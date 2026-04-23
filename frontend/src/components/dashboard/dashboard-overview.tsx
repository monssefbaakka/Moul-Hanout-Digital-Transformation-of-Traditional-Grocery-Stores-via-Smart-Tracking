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
  CirclePlus,
  Leaf,
  Package2,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { AuthSessionPanel } from '@/components/auth/auth-session-panel';
import { AlertsDropdown } from '@/components/alerts/alerts-dropdown';
import { Button } from '@/components/ui/button';
import { inventoryApi, reportsApi, salesApi } from '@/lib/api/api-client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { DailySummary, InventoryItem, Sale, SalesReport } from '@moul-hanout/shared-types';
import styles from './dashboard-overview.module.css';

type DashboardState = {
  summary: DailySummary | null;
  inventory: InventoryItem[];
  salesTrend: SalesReport | null;
  recentSales: Sale[];
};

type RankedProduct = {
  name: string;
  revenue: number;
  quantitySold: number;
  ratio: number;
  isFallback?: boolean;
};

type DistributionSlice = {
  label: string;
  value: number;
  color: string;
  isFallback?: boolean;
};

type RecentTransactionRow = {
  id: string;
  receiptNumber: string;
  typeLabel: string;
  customerLabel: string;
  amount: number;
  soldAt: string;
  status: Sale['status'];
};

type BusinessTip = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
};

const DISTRIBUTION_COLORS = ['#4b915b', '#ccb28c', '#eadfca'] as const;

// Temporary fallback until the backend exposes richer ranking data beyond the daily summary.
const FALLBACK_TOP_PRODUCTS: Omit<RankedProduct, 'ratio'>[] = [
  { name: 'Pistaches', revenue: 1250, quantitySold: 18, isFallback: true },
  { name: "Huile d'argan", revenue: 980, quantitySold: 11, isFallback: true },
  { name: 'Dattes', revenue: 750, quantitySold: 14, isFallback: true },
  { name: "Huile d'olive", revenue: 620, quantitySold: 9, isFallback: true },
  { name: 'Couscous', revenue: 430, quantitySold: 16, isFallback: true },
];

// Temporary fallback to preserve the donut-card layout before enough live sales exist to derive a mix.
const FALLBACK_DISTRIBUTION: DistributionSlice[] = [
  { label: 'Vente comptoir', value: 60, color: DISTRIBUTION_COLORS[0], isFallback: true },
  { label: 'Carte', value: 25, color: DISTRIBUTION_COLORS[1], isFallback: true },
  { label: 'Autre', value: 15, color: DISTRIBUTION_COLORS[2], isFallback: true },
];

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
    return `${(amount / 1000).toFixed(2)}k MAD`;
  }

  return `${amount.toFixed(2)} MAD`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-MA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatChartDay(value: string) {
  return new Date(value).toLocaleDateString('fr-MA', { weekday: 'short' });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Welcome back';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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

function getRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

function toChartData(report: SalesReport | null) {
  return (report?.days ?? []).map((day) => ({
    date: day.date,
    label: formatChartDay(day.date),
    revenue: Math.round(day.revenue * 100) / 100,
  }));
}

function buildRankedProducts(summary: DailySummary | null): RankedProduct[] {
  const source =
    summary?.topProducts.length
      ? summary.topProducts.map((product) => ({
          name: product.productName,
          revenue: product.revenue,
          quantitySold: product.quantitySold,
        }))
      : FALLBACK_TOP_PRODUCTS;

  const maxRevenue = source[0]?.revenue ?? 1;

  return source.map((product) => ({
    ...product,
    ratio: Math.max(10, Math.round((product.revenue / maxRevenue) * 100)),
  }));
}

function buildDistribution(sales: Sale[]): DistributionSlice[] {
  const grouped = sales.reduce<Record<string, number>>((accumulator, sale) => {
    accumulator[sale.paymentMode] = (accumulator[sale.paymentMode] ?? 0) + sale.total;
    return accumulator;
  }, {});

  const entries = [
    { label: 'Vente comptoir', value: grouped.CASH ?? 0, color: DISTRIBUTION_COLORS[0] },
    { label: 'Carte', value: grouped.CARD ?? 0, color: DISTRIBUTION_COLORS[1] },
    { label: 'Autre', value: grouped.OTHER ?? 0, color: DISTRIBUTION_COLORS[2] },
  ].filter((slice) => slice.value > 0);

  if (entries.length === 0) {
    return FALLBACK_DISTRIBUTION;
  }

  const total = entries.reduce((sum, slice) => sum + slice.value, 0);

  return entries.map((slice) => ({
    ...slice,
    value: Number(((slice.value / total) * 100).toFixed(1)),
  }));
}

function getTypeLabel(mode: Sale['paymentMode']) {
  if (mode === 'CARD') return 'Carte';
  if (mode === 'OTHER') return 'Autre';
  return 'POS Sale';
}

function getStatusLabel(status: Sale['status']) {
  if (status === 'COMPLETED') return 'Completed';
  if (status === 'CANCELLED') return 'Cancelled';
  return 'Pending';
}

function buildRecentTransactions(sales: Sale[]): RecentTransactionRow[] {
  return sales.map((sale) => ({
    id: sale.id,
    receiptNumber: sale.receiptNumber,
    typeLabel: getTypeLabel(sale.paymentMode),
    // Temporary placeholder until customer data is present on the sales list contract.
    customerLabel: sale.paymentMode === 'CARD' ? 'Client carte' : 'Walk-in Customer',
    amount: sale.total,
    soldAt: sale.soldAt,
    status: sale.status,
  }));
}

function buildBusinessTip(
  lowStockCount: number,
  expiringSoonCount: number,
  topProduct: RankedProduct | null,
): BusinessTip {
  if (lowStockCount > 0) {
    return {
      title: 'Priorite au reassort',
      description:
        'Remettez en avant les references a faible stock pour eviter une rupture pendant les heures de pointe.',
      href: '/inventaire',
      actionLabel: "Ouvrir l'inventaire",
    };
  }

  if (expiringSoonCount > 0) {
    return {
      title: 'Accelerez la rotation',
      description:
        "Planifiez une mise en avant courte ou une offre duo pour les produits proches de l'expiration.",
      href: '/inventaire',
      actionLabel: 'Verifier les dates',
    };
  }

  if (topProduct) {
    return {
      title: 'Capitalisez sur votre best-seller',
      description: `Gardez ${topProduct.name} bien visible pres de la caisse pour prolonger sa dynamique de vente.`,
      href: '/produits',
      actionLabel: 'Voir les produits',
    };
  }

  return {
    title: 'Affinez votre rythme quotidien',
    description:
      'Suivez vos encaissements et votre stock chaque matin pour garder une exploitation fluide et rentable.',
    href: '/rapports',
    actionLabel: 'Consulter les rapports',
  };
}

function computeDelta(currentValue: number, report: SalesReport | null, key: 'revenue' | 'transactions') {
  const values = (report?.days ?? []).map((day) => (key === 'revenue' ? day.revenue : day.transactions));
  if (values.length === 0) return null;

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (average === 0) return null;

  return ((currentValue - average) / average) * 100;
}

function MetricCardSkeleton() {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricHead}>
        <div className={styles.metricTitleWrap}>
          <span className={cn(styles.skeleton, styles.skeletonTitle)} aria-hidden="true" />
        </div>
        <span className={cn(styles.metricIcon, styles.skeleton)} aria-hidden="true" />
      </div>
      <span className={cn(styles.skeleton, styles.skeletonValue)} aria-hidden="true" />
      <span className={cn(styles.skeleton, styles.skeletonTitle)} aria-hidden="true" />
    </article>
  );
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
      <p className={styles.tooltipLabel}>{formatDate(currentPoint.payload.date)}</p>
      <div className={styles.tooltipValue}>{formatCurrency(currentPoint.value)}</div>
    </div>
  );
}

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isOwner = user?.role === 'OWNER';
  const [dashboard, setDashboard] = useState<DashboardState>({
    summary: null,
    inventory: [],
    salesTrend: null,
    recentSales: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage(null);

      const range = getRange(7);
      const [summaryResult, inventoryResult, salesTrendResult, recentSalesResult] = await Promise.allSettled([
        salesApi.dailySummary(),
        inventoryApi.list(),
        reportsApi.salesReport(range),
        salesApi.list({ page: 1, limit: 6 }),
      ]);

      if (!isActive) {
        return;
      }

      const nextState: DashboardState = {
        summary: summaryResult.status === 'fulfilled' ? summaryResult.value : null,
        inventory: inventoryResult.status === 'fulfilled' ? inventoryResult.value : [],
        salesTrend: salesTrendResult.status === 'fulfilled' ? salesTrendResult.value : null,
        recentSales: recentSalesResult.status === 'fulfilled' ? recentSalesResult.value.items : [],
      };

      const failures = [summaryResult, inventoryResult, salesTrendResult, recentSalesResult].filter(
        (result) => result.status === 'rejected',
      ).length;

      setDashboard(nextState);
      setErrorMessage(
        failures === 4
          ? 'Impossible de charger le dashboard pour le moment.'
          : failures > 0
            ? 'Certaines cartes utilisent un etat de secours pendant la synchronisation des donnees.'
            : null,
      );
      setIsLoading(false);
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [reloadToken]);

  const firstName = user?.name?.split(' ')[0] ?? 'Manager';
  const lowStockItems = useMemo(
    () => dashboard.inventory.filter((item) => item.isLowStock),
    [dashboard.inventory],
  );
  const expiringSoonItems = useMemo(
    () => dashboard.inventory.filter((item) => item.isExpiringSoon),
    [dashboard.inventory],
  );
  const chartData = useMemo(() => toChartData(dashboard.salesTrend), [dashboard.salesTrend]);
  const rankedProducts = useMemo(() => buildRankedProducts(dashboard.summary), [dashboard.summary]);
  const topProduct = rankedProducts[0] ?? null;
  const paymentMix = useMemo(() => buildDistribution(dashboard.recentSales), [dashboard.recentSales]);
  const recentTransactions = useMemo(
    () => buildRecentTransactions(dashboard.recentSales),
    [dashboard.recentSales],
  );
  const businessTip = useMemo(
    () => buildBusinessTip(lowStockItems.length, expiringSoonItems.length, topProduct),
    [expiringSoonItems.length, lowStockItems.length, topProduct],
  );
  const revenueDelta = computeDelta(dashboard.summary?.totalRevenue ?? 0, dashboard.salesTrend, 'revenue');
  const transactionDelta = computeDelta(dashboard.summary?.transactionCount ?? 0, dashboard.salesTrend, 'transactions');

  const actionLinks = isOwner
    ? [
        { href: '/produits', label: 'Add Product', icon: CirclePlus, variant: 'primary' as const },
        { href: '/vente', label: 'Start Sale', icon: ReceiptText, variant: 'secondary' as const },
        { href: '/categories', label: 'Add Category', icon: Tag, variant: 'secondary' as const },
      ]
    : [
        { href: '/vente', label: 'Start Sale', icon: ReceiptText, variant: 'primary' as const },
        { href: '/inventaire', label: 'Check Stock', icon: Package2, variant: 'secondary' as const },
        { href: '/profil', label: 'Open Profile', icon: ShieldCheck, variant: 'secondary' as const },
      ];

  return (
    <main className={styles.dashboard}>
      <section className={styles.header}>
        <div className={styles.welcomeBlock}>
          <span className={styles.eyebrow}>Moul Hanout dashboard</span>
          <h1 className={styles.heading}>
            {getGreeting()}, <span className={styles.headingAccent}>{firstName}</span>
          </h1>
          <p className={styles.subtitle}>
            Voici ce qui se passe dans votre boutique aujourd&apos;hui, avec une vue claire sur les ventes,
            le stock et les actions prioritaires.
          </p>

          <div className={styles.metaRow}>
            <span className={styles.metaPill}>
              <CalendarDays size={15} />
              {formatDate(new Date().toISOString())}
            </span>
            <span className={styles.metaPill}>
              <ShieldCheck size={15} />
              {isOwner ? 'Owner workspace' : 'Cashier workspace'}
            </span>
            <span
              className={cn(
                styles.metaPill,
                lowStockItems.length > 0 && styles.metaPillWarning,
              )}
            >
              <AlertTriangle size={15} />
              {lowStockItems.length > 0
                ? `${lowStockItems.length} low stock alert${lowStockItems.length > 1 ? 's' : ''}`
                : 'Stock under control'}
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.utilityRow}>
            <AlertsDropdown compact />
            <Link href="/profil" className={styles.profileShortcut}>
              <span className={styles.profileShortcutAvatar}>{getInitials(user?.name ?? 'MH')}</span>
              <span className={styles.statusDot} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.actionGroup}>
            {actionLinks.map((action) => (
              <Button
                key={action.href}
                asChild
                variant={action.variant === 'primary' ? 'default' : 'outline'}
                className={cn(
                  action.variant === 'primary' ? styles.actionPrimary : styles.actionSecondary,
                )}
              >
                <Link href={action.href}>
                  <action.icon size={17} />
                  <span>{action.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {errorMessage ? (
        <div className={styles.banner} role="status">
          <span>{errorMessage}</span>
          <button
            type="button"
            className={styles.bannerAction}
            onClick={() => setReloadToken((value) => value + 1)}
          >
            Refresh
          </button>
        </div>
      ) : null}

      <section className={styles.kpiGrid} aria-label="Key performance indicators">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <article className={styles.metricCard}>
              <div className={styles.metricHead}>
                <div className={styles.metricTitleWrap}>
                  <span className={styles.metricLabel}>Today&apos;s Revenue</span>
                  <span className={styles.metricHint}>Encaissement journalier</span>
                </div>
                <span className={styles.metricIcon}>
                  <TrendingUp size={18} />
                </span>
              </div>
              <p className={styles.metricValue}>{formatCurrency(dashboard.summary?.totalRevenue ?? 0)}</p>
              <div className={styles.metricFoot}>
                <span className={styles.metricTrend}>
                  <TrendingUp size={15} />
                  {revenueDelta === null
                    ? 'Benchmark indisponible'
                    : `${revenueDelta >= 0 ? '+' : ''}${revenueDelta.toFixed(1)}% vs moyenne 7j`}
                </span>
              </div>
            </article>

            <article className={styles.metricCard}>
              <div className={styles.metricHead}>
                <div className={styles.metricTitleWrap}>
                  <span className={styles.metricLabel}>Sales Count</span>
                  <span className={styles.metricHint}>Ventes finalisees aujourd&apos;hui</span>
                </div>
                <span className={styles.metricOrb}>
                  <ShoppingBag size={20} />
                </span>
              </div>
              <p className={styles.metricValue}>
                {(dashboard.summary?.transactionCount ?? 0).toLocaleString('fr-MA')}
              </p>
              <div className={styles.metricFoot}>
                <span className={styles.metricTrend}>
                  <TrendingUp size={15} />
                  {transactionDelta === null
                    ? 'Benchmark indisponible'
                    : `${transactionDelta >= 0 ? '+' : ''}${transactionDelta.toFixed(1)}% vs moyenne 7j`}
                </span>
              </div>
            </article>

            <article className={styles.metricCard}>
              <div className={styles.metricHead}>
                <div className={styles.metricTitleWrap}>
                  <span className={styles.metricLabel}>Low Stock Alerts</span>
                  <span className={styles.metricHint}>References a reapprovisionner</span>
                </div>
                <span className={cn(styles.metricIcon, styles.metricIconWarning)}>
                  <AlertTriangle size={18} />
                </span>
              </div>
              <p className={styles.metricValue}>{lowStockItems.length}</p>
              <div className={styles.metricFoot}>
                <Link href="/inventaire" className={styles.metricLink}>
                  View all alerts <ArrowRight size={14} />
                </Link>
              </div>
            </article>

            <article className={styles.metricCard}>
              <div className={styles.metricHead}>
                <div className={styles.metricTitleWrap}>
                  <span className={styles.metricLabel}>Top Product</span>
                  <span className={styles.metricHint}>
                    {topProduct?.isFallback ? 'Visual fallback' : 'Classement du jour'}
                  </span>
                </div>
                <span className={styles.topProductPill}>{getInitials(topProduct?.name ?? 'MH')}</span>
              </div>
              <p className={styles.metricValue}>{topProduct?.name ?? 'En attente'}</p>
              <div className={styles.metricFoot}>
                <span className={styles.metricTrend}>
                  <Leaf size={15} />
                  {topProduct ? formatCompactCurrency(topProduct.revenue) : 'Aucune vente'}
                </span>
              </div>
            </article>
          </>
        )}
      </section>

      <section className={styles.grid}>
        <article className={cn(styles.chartCard, styles.chartCardLarge)}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Revenue Overview</h2>
              <p>Tendance des 7 derniers jours a partir du reporting existant.</p>
              <div className={styles.chartTotal}>
                <strong>{formatCurrency(dashboard.summary?.totalRevenue ?? 0)}</strong>
                <span>Performance du jour</span>
              </div>
            </div>
            <span className={styles.rangePill}>This Week</span>
          </div>

          {isLoading ? (
            <div className={cn(styles.skeleton, styles.skeletonChart)} aria-hidden="true" />
          ) : chartData.length === 0 ? (
            <div className={styles.emptyState}>
              <TrendingUp size={28} />
              <p>Aucune donnee de revenu disponible pour cette periode.</p>
            </div>
          ) : (
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={288}>
                <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4b915b" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#4b915b" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#7b826f' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: '#7b826f' }}
                    tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                    width={44}
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

        <article className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Top Products</h2>
              <p>Produits les plus performants sur les donnees disponibles.</p>
            </div>
            <span className={styles.rangePill}>
              {rankedProducts.some((product) => product.isFallback) ? 'Fallback' : 'Today'}
            </span>
          </div>

          <div className={styles.productsList}>
            {rankedProducts.slice(0, 5).map((product) => (
              <article key={product.name} className={styles.productRow}>
                <span className={styles.productAvatar}>{getInitials(product.name)}</span>
                <div className={styles.productCopy}>
                  <strong>{product.name}</strong>
                  <span className={styles.productMeta}>{formatCompactCurrency(product.revenue)}</span>
                </div>
                <div className={styles.progressTrack} aria-hidden="true">
                  <div className={styles.progressBar} style={{ width: `${product.ratio}%` }} />
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className={cn(styles.chartCard, styles.donutCard)}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Sales Distribution</h2>
              <p>Repartition des modes de paiement sur les transactions recentes.</p>
            </div>
            <span className={styles.rangePill}>
              {paymentMix.some((slice) => slice.isFallback) ? 'Fallback' : 'Recent sales'}
            </span>
          </div>

          <div className={styles.donutVisual}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={paymentMix}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {paymentMix.map((slice) => (
                    <Cell key={slice.label} fill={slice.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutCenter}>
              <strong>{formatCompactCurrency(dashboard.summary?.totalRevenue ?? 0)}</strong>
              <span>Revenue</span>
            </div>
          </div>

          <div className={styles.legendList}>
            {paymentMix.map((slice) => (
              <div key={slice.label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ backgroundColor: slice.color }} />
                <span className={styles.legendLabel}>{slice.label}</span>
                <span className={styles.legendValue}>{slice.value}%</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.tableLayout}>
        <article className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div>
              <h2>Recent Transactions</h2>
              <p>Dernieres ventes remontees par le point de vente.</p>
            </div>
            <Link href="/ventes" className={styles.tableLink}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className={cn(styles.skeleton, styles.skeletonChart)} aria-hidden="true" />
          ) : recentTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <ReceiptText size={28} />
              <p>Aucune transaction recente a afficher.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <Link href={`/ventes?receipt=${transaction.receiptNumber}`} className={styles.invoiceLink}>
                          {transaction.receiptNumber}
                        </Link>
                      </td>
                      <td>
                        <span className={styles.typePill}>{transaction.typeLabel}</span>
                      </td>
                      <td>{transaction.customerLabel}</td>
                      <td>{formatCurrency(transaction.amount)}</td>
                      <td>{formatDateTime(transaction.soldAt)}</td>
                      <td>
                        <span
                          className={cn(
                            styles.statusPill,
                            transaction.status === 'COMPLETED' && styles.statusCompleted,
                            transaction.status === 'PENDING' && styles.statusPending,
                            transaction.status === 'CANCELLED' && styles.statusCancelled,
                          )}
                        >
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className={styles.tipCard}>
          <div className={styles.tipHeader}>
            <span className={styles.tipIcon}>
              <Leaf size={18} />
            </span>
            <div>
              <h2>Business Tip</h2>
              <p className={styles.tipText}>{businessTip.title}</p>
            </div>
          </div>

          <p className={styles.tipText}>{businessTip.description}</p>

          <Link href={businessTip.href} className={styles.tipAction}>
            {businessTip.actionLabel}
            <ArrowRight size={14} />
          </Link>

          <div className={styles.tipDecoration} aria-hidden="true">
            <div className={styles.tipDecorationInner}>
              <span className={styles.tipDecorationPlant} />
            </div>
          </div>
        </aside>
      </section>

      {hasHydrated ? (
        <section className={styles.sessionCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Session &amp; Access</h2>
              <p>Controle rapide de la session active sans quitter le tableau de bord.</p>
            </div>
            <span className={styles.badge}>{isOwner ? 'Owner' : 'Cashier'}</span>
          </div>
          <AuthSessionPanel />
        </section>
      ) : null}
    </main>
  );
}
