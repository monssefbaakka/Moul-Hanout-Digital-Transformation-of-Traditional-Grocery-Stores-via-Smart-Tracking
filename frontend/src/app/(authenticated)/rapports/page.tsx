"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Download,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Star,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { reportsApi } from "@/lib/api/api-client";
import type { InventoryReport, SalesReport } from "@moul-hanout/shared-types";

type PresetRange = "7d" | "30d" | "90d";

function toIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function createRange(days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function getDefaultRange() {
  return createRange(30);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("fr-MA", {
    day: "2-digit",
    month: "short",
  });
}

function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("fr-MA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M MAD`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k MAD`;
  return formatCurrency(value);
}

// Custom tooltip for the chart
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpt-chart-tooltip">
      <p className="rpt-chart-tooltip__label">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="rpt-chart-tooltip__row">
          <span className="rpt-chart-tooltip__dot" style={{ background: entry.color }} />
          <span>{entry.name === "revenue" ? "Revenu" : "Transactions"}</span>
          <strong>
            {entry.name === "revenue"
              ? formatCurrency(entry.value)
              : entry.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

export default function RapportsPage() {
  const [range, setRange] = useState(getDefaultRange);
  const [activePreset, setActivePreset] = useState<PresetRange>("30d");
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReports = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([
      reportsApi.salesReport({ from: range.from, to: range.to }),
      reportsApi.inventoryReport(),
    ])
      .then(([sales, inventory]) => {
        setSalesReport(sales);
        setInventoryReport(inventory);
      })
      .catch(() => {
        setErrorMessage("Impossible de charger les rapports pour cette période.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [range.from, range.to]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  async function handleExport() {
    setIsExporting(true);
    setErrorMessage(null);
    try {
      await reportsApi.exportSalesCsv({ from: range.from, to: range.to });
    } catch {
      setErrorMessage("Échec de l'export CSV.");
    } finally {
      setIsExporting(false);
    }
  }

  function applyPreset(preset: PresetRange) {
    setActivePreset(preset);
    setRange(
      preset === "7d" ? createRange(7) : preset === "90d" ? createRange(90) : createRange(30),
    );
  }

  const chartData = useMemo(
    () =>
      (salesReport?.days ?? []).map((day) => ({
        date: formatShortDate(day.date),
        revenue: Math.round(day.revenue * 100) / 100,
        transactions: day.transactions,
      })),
    [salesReport],
  );

  const lowStockCount = inventoryReport?.lowStock.length ?? 0;
  const expiringSoonCount = inventoryReport?.expiringSoon.length ?? 0;
  const averageBasket =
    salesReport && salesReport.totalTransactions > 0
      ? salesReport.totalRevenue / salesReport.totalTransactions
      : 0;
  const activeSalesDays = salesReport?.days.length ?? 0;
  const averageDailyRevenue =
    salesReport && activeSalesDays > 0 ? salesReport.totalRevenue / activeSalesDays : 0;
  const averageDailyTransactions =
    salesReport && activeSalesDays > 0 ? salesReport.totalTransactions / activeSalesDays : 0;

  const bestRevenueDay = useMemo(() => {
    return (salesReport?.days ?? []).reduce<SalesReport["days"][number] | null>((best, day) => {
      if (!best || day.revenue > best.revenue) return day;
      return best;
    }, null);
  }, [salesReport]);

  const busiestDay = useMemo(() => {
    return (salesReport?.days ?? []).reduce<SalesReport["days"][number] | null>((best, day) => {
      if (!best || day.transactions > best.transactions) return day;
      return best;
    }, null);
  }, [salesReport]);

  const dailyPerformanceRows = useMemo(
    () =>
      (salesReport?.days ?? [])
        .map((day) => ({
          ...day,
          averageTicket: day.transactions > 0 ? day.revenue / day.transactions : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue),
    [salesReport],
  );

  const alertCount = lowStockCount + expiringSoonCount;

  return (
    <main className="page stack app-page rpt-page">

      {/* ── Page header ── */}
      <div className="rpt-header">
        <div className="rpt-header__copy">
          <h1 className="rpt-header__title">Rapports &amp; Analyses</h1>
          <p className="rpt-header__sub">
            Analysez vos ventes et l&apos;état du stock sur la période choisie.
          </p>
        </div>
        <button
          type="button"
          className="rpt-export-btn"
          onClick={handleExport}
          disabled={isExporting || isLoading}
        >
          <Download size={15} />
          {isExporting ? "Export…" : "Exporter CSV"}
        </button>
      </div>

      {/* ── Error ── */}
      {errorMessage && (
        <div className="rpt-error" role="alert">
          <TriangleAlert size={16} />
          <span>{errorMessage}</span>
          <button type="button" className="rpt-error__retry" onClick={loadReports}>
            <RefreshCw size={14} />
            Réessayer
          </button>
        </div>
      )}

      {/* ── Date range filter ── */}
      <section className="rpt-filter-bar panel">
        <div className="rpt-filter-bar__presets">
          {(["7d", "30d", "90d"] as PresetRange[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`rpt-preset-btn${activePreset === p ? " is-active" : ""}`}
              onClick={() => applyPreset(p)}
            >
              {p === "7d" ? "7 jours" : p === "30d" ? "30 jours" : "90 jours"}
            </button>
          ))}
        </div>

        <div className="rpt-filter-bar__sep" aria-hidden="true" />

        <div className="rpt-filter-bar__dates">
          <CalendarDays size={15} className="rpt-filter-bar__cal-icon" />
          <label className="rpt-date-field">
            <span>Du</span>
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => {
                setActivePreset("30d");
                setRange((r) => ({ ...r, from: e.target.value }));
              }}
            />
          </label>
          <span className="rpt-filter-bar__dash">—</span>
          <label className="rpt-date-field">
            <span>Au</span>
            <input
              type="date"
              value={range.to}
              min={range.from}
              onChange={(e) => {
                setActivePreset("30d");
                setRange((r) => ({ ...r, to: e.target.value }));
              }}
            />
          </label>
        </div>
      </section>

      {/* ── KPI cards ── */}
      <div className="rpt-kpi-grid">
        <article className="rpt-kpi-card rpt-kpi-card--green">
          <div className="rpt-kpi-card__icon">
            <TrendingUp size={18} />
          </div>
          <div className="rpt-kpi-card__body">
            <span className="rpt-kpi-card__label">Revenu total</span>
            <strong className="rpt-kpi-card__value">
              {isLoading ? "—" : formatShortCurrency(salesReport?.totalRevenue ?? 0)}
            </strong>
            <p className="rpt-kpi-card__hint">Montant cumulé sur la période</p>
          </div>
        </article>

        <article className="rpt-kpi-card rpt-kpi-card--blue">
          <div className="rpt-kpi-card__icon">
            <ShoppingBag size={18} />
          </div>
          <div className="rpt-kpi-card__body">
            <span className="rpt-kpi-card__label">Transactions</span>
            <strong className="rpt-kpi-card__value">
              {isLoading ? "—" : (salesReport?.totalTransactions ?? 0).toLocaleString("fr-MA")}
            </strong>
            <p className="rpt-kpi-card__hint">Ventes complétées</p>
          </div>
        </article>

        <article className="rpt-kpi-card rpt-kpi-card--purple">
          <div className="rpt-kpi-card__icon">
            <ShoppingCart size={18} />
          </div>
          <div className="rpt-kpi-card__body">
            <span className="rpt-kpi-card__label">Panier moyen</span>
            <strong className="rpt-kpi-card__value">
              {isLoading ? "—" : formatShortCurrency(averageBasket)}
            </strong>
            <p className="rpt-kpi-card__hint">Valeur moyenne par ticket</p>
          </div>
        </article>

        <article className={`rpt-kpi-card ${alertCount > 0 ? "rpt-kpi-card--amber" : "rpt-kpi-card--neutral"}`}>
          <div className="rpt-kpi-card__icon">
            <AlertTriangle size={18} />
          </div>
          <div className="rpt-kpi-card__body">
            <span className="rpt-kpi-card__label">Alertes stock</span>
            <strong className="rpt-kpi-card__value">
              {isLoading ? "—" : alertCount}
            </strong>
            <p className="rpt-kpi-card__hint">
              {alertCount > 0 ? (
                <Link href="/inventaire" className="rpt-kpi-link">
                  {lowStockCount} faible · {expiringSoonCount} expirant
                </Link>
              ) : (
                "Aucune alerte en cours"
              )}
            </p>
          </div>
        </article>
      </div>

      {/* ── Insight row ── */}
      <div className="rpt-insight-row">
        <article className="panel rpt-insight-card">
          <div className="rpt-insight-card__head">
            <span className="rpt-insight-badge rpt-insight-badge--green">
              <Clock size={14} />
            </span>
            <span className="rpt-insight-label">Rythme journalier</span>
          </div>
          <strong className="rpt-insight-value">
            {isLoading ? "—" : formatShortCurrency(averageDailyRevenue)}
          </strong>
          <p className="rpt-insight-sub">Revenu moyen par jour actif</p>
          <div className="rpt-insight-meta">
            <div>
              <dt>Jours avec ventes</dt>
              <dd>{isLoading ? "—" : activeSalesDays}</dd>
            </div>
            <div>
              <dt>Transactions / jour</dt>
              <dd>{isLoading ? "—" : averageDailyTransactions.toFixed(1)}</dd>
            </div>
          </div>
        </article>

        <article className="panel rpt-insight-card">
          <div className="rpt-insight-card__head">
            <span className="rpt-insight-badge rpt-insight-badge--yellow">
              <Star size={14} />
            </span>
            <span className="rpt-insight-label">Meilleur jour</span>
          </div>
          <strong className="rpt-insight-value">
            {isLoading || !bestRevenueDay ? "—" : formatShortCurrency(bestRevenueDay.revenue)}
          </strong>
          <p className="rpt-insight-sub">
            {!isLoading && bestRevenueDay
              ? formatLongDate(bestRevenueDay.date)
              : "Chargement…"}
          </p>
          {!isLoading && bestRevenueDay && (
            <div className="rpt-insight-meta">
              <div>
                <dt>Transactions</dt>
                <dd>{bestRevenueDay.transactions}</dd>
              </div>
            </div>
          )}
        </article>

        <article className="panel rpt-insight-card">
          <div className="rpt-insight-card__head">
            <span className="rpt-insight-badge rpt-insight-badge--blue">
              <ShoppingBag size={14} />
            </span>
            <span className="rpt-insight-label">Pic de fréquentation</span>
          </div>
          <strong className="rpt-insight-value">
            {isLoading || !busiestDay ? "—" : `${busiestDay.transactions} ventes`}
          </strong>
          <p className="rpt-insight-sub">
            {!isLoading && busiestDay ? formatLongDate(busiestDay.date) : "Chargement…"}
          </p>
          {!isLoading && busiestDay && (
            <div className="rpt-insight-meta">
              <div>
                <dt>Revenu ce jour</dt>
                <dd>{formatShortCurrency(busiestDay.revenue)}</dd>
              </div>
            </div>
          )}
        </article>

        <article className="panel rpt-insight-card">
          <div className="rpt-insight-card__head">
            <span className={`rpt-insight-badge ${alertCount > 0 ? "rpt-insight-badge--amber" : "rpt-insight-badge--green"}`}>
              <Package size={14} />
            </span>
            <span className="rpt-insight-label">État du stock</span>
          </div>
          <strong className="rpt-insight-value">
            {isLoading ? "—" : alertCount > 0 ? `${alertCount} alertes` : "OK"}
          </strong>
          <p className="rpt-insight-sub">Produits à surveiller</p>
          {!isLoading && (
            <div className="rpt-insight-meta">
              <div>
                <dt>Stock faible</dt>
                <dd className={lowStockCount > 0 ? "is-warn" : ""}>{lowStockCount}</dd>
              </div>
              <div>
                <dt>Expirent bientôt</dt>
                <dd className={expiringSoonCount > 0 ? "is-warn" : ""}>{expiringSoonCount}</dd>
              </div>
            </div>
          )}
        </article>
      </div>

      {/* ── Revenue chart ── */}
      <section className="panel rpt-chart-section">
        <div className="rpt-section-head">
          <div>
            <h2>Évolution du revenu journalier</h2>
            <p>Revenu (barres) et transactions (ligne) jour après jour.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="rpt-chart-placeholder">
            <div className="rpt-chart-placeholder__bars">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="rpt-chart-placeholder__bar"
                  style={{ height: `${30 + Math.random() * 60}%` }}
                />
              ))}
            </div>
            <p>Chargement du graphique…</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="rpt-empty">
            <TrendingUp size={32} />
            <p>Aucune vente disponible sur cette période.</p>
          </div>
        ) : (
          <div className="rpt-chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--text-soft)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="revenue"
                  tick={{ fontSize: 11, fill: "var(--text-soft)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  width={42}
                />
                <YAxis
                  yAxisId="txn"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--text-soft)" }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  formatter={(value) => (value === "revenue" ? "Revenu" : "Transactions")}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Bar
                  yAxisId="revenue"
                  dataKey="revenue"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Line
                  yAxisId="txn"
                  type="monotone"
                  dataKey="transactions"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ── Daily performance table ── */}
      {!isLoading && dailyPerformanceRows.length > 0 && (
        <section className="panel rpt-table-section">
          <div className="rpt-section-head">
            <div>
              <h2>Performance quotidienne</h2>
              <p>Classée par revenu décroissant — comparez les meilleures journées.</p>
            </div>
            <span className="rpt-badge">{dailyPerformanceRows.length} jours</span>
          </div>
          <div className="rpt-table-wrap">
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Revenu</th>
                  <th>Transactions</th>
                  <th>Panier moyen</th>
                </tr>
              </thead>
              <tbody>
                {dailyPerformanceRows.map((day, idx) => (
                  <tr key={day.date} className={idx === 0 ? "is-best" : ""}>
                    <td className="rpt-table__rank">
                      {idx === 0 ? <Star size={13} className="rpt-star" /> : idx + 1}
                    </td>
                    <td>{formatLongDate(day.date)}</td>
                    <td className="rpt-table__money">{formatCurrency(day.revenue)}</td>
                    <td>{day.transactions}</td>
                    <td className="rpt-table__money rpt-table__muted">
                      {formatCurrency(day.averageTicket)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Low stock table ── */}
      {!isLoading && lowStockCount > 0 && (
        <section className="panel rpt-table-section rpt-table-section--warn">
          <div className="rpt-section-head">
            <div>
              <h2>
                <AlertTriangle size={16} className="rpt-section-icon-warn" />
                Produits en stock faible
              </h2>
              <p>Ces produits méritent un réapprovisionnement rapide.</p>
            </div>
            <span className="rpt-badge rpt-badge--warn">{lowStockCount} produit{lowStockCount > 1 ? "s" : ""}</span>
          </div>
          <div className="rpt-table-wrap">
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Stock actuel</th>
                  <th>Seuil d&apos;alerte</th>
                  <th>Unité</th>
                </tr>
              </thead>
              <tbody>
                {inventoryReport!.lowStock.map((item) => (
                  <tr key={item.id}>
                    <td className="rpt-table__product">{item.name}</td>
                    <td>
                      <span className="rpt-category-pill">{item.categoryName}</span>
                    </td>
                    <td>
                      <span className="rpt-stock-badge rpt-stock-badge--low">{item.currentStock}</span>
                    </td>
                    <td className="rpt-table__muted">{item.lowStockThreshold}</td>
                    <td className="rpt-table__muted">{item.unit ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Expiring soon table ── */}
      {!isLoading && expiringSoonCount > 0 && (
        <section className="panel rpt-table-section rpt-table-section--warn">
          <div className="rpt-section-head">
            <div>
              <h2>
                <AlertTriangle size={16} className="rpt-section-icon-warn" />
                Produits proches de l&apos;expiration
              </h2>
              <p>Anticipez les pertes et écoulez ces références en priorité.</p>
            </div>
            <span className="rpt-badge rpt-badge--warn">{expiringSoonCount} produit{expiringSoonCount > 1 ? "s" : ""}</span>
          </div>
          <div className="rpt-table-wrap">
            <table className="rpt-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Stock</th>
                  <th>Date d&apos;expiration</th>
                </tr>
              </thead>
              <tbody>
                {inventoryReport!.expiringSoon.map((item) => (
                  <tr key={item.id}>
                    <td className="rpt-table__product">{item.name}</td>
                    <td>
                      <span className="rpt-category-pill">{item.categoryName}</span>
                    </td>
                    <td>{item.currentStock}</td>
                    <td>
                      <span className="rpt-stock-badge rpt-stock-badge--expiry">
                        {item.expirationDate
                          ? new Date(item.expirationDate).toLocaleDateString("fr-MA")
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
