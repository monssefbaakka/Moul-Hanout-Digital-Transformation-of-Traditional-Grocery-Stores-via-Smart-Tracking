'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { reportsApi } from '@/lib/api/api-client';
import type { InventoryReport, SalesReport } from '@moul-hanout/shared-types';

type PresetRange = '7d' | '30d' | '90d';

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0];
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
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
  });
}

export default function RapportsPage() {
  const [range, setRange] = useState(getDefaultRange);
  const [activePreset, setActivePreset] = useState<PresetRange>('30d');
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
        setErrorMessage('Impossible de charger les rapports pour cette periode.');
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
      setErrorMessage("Echec de l'export CSV.");
    } finally {
      setIsExporting(false);
    }
  }

  function applyPreset(preset: PresetRange) {
    setActivePreset(preset);
    setRange(
      preset === '7d' ? createRange(7) : preset === '90d' ? createRange(90) : createRange(30),
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

  return (
    <main className="page stack app-page">
      <AppPageHeader
        title="Rapports"
        subtitle="Analysez les ventes et l'etat du stock sur la periode choisie, puis exportez vos chiffres si besoin."
        actions={
          <button
            type="button"
            className="app-btn app-btn--primary"
            onClick={handleExport}
            disabled={isExporting || isLoading}
          >
            {isExporting ? 'Export...' : 'Exporter CSV'}
          </button>
        }
      />

      {errorMessage ? (
        <div className="app-alert app-alert--danger" role="alert">
          <span className="app-alert__content">{errorMessage}</span>
          <button type="button" className="app-btn app-btn--secondary" onClick={loadReports}>
            Recharger
          </button>
        </div>
      ) : null}

      <section className="panel reports-filters">
        <div className="reports-filters__copy">
          <h2>Periode d&apos;analyse</h2>
          <p>Choisissez une plage personnalisee ou utilisez un raccourci pour aller plus vite.</p>
        </div>

        <div className="reports-filters__controls">
          <div className="reports-filters__dates">
            <label className="field">
              <span>Du</span>
              <input
                type="date"
                className="input"
                value={range.from}
                max={range.to}
                onChange={(event) => {
                  setActivePreset('30d');
                  setRange((current) => ({ ...current, from: event.target.value }));
                }}
              />
            </label>

            <label className="field">
              <span>Au</span>
              <input
                type="date"
                className="input"
                value={range.to}
                min={range.from}
                onChange={(event) => {
                  setActivePreset('30d');
                  setRange((current) => ({ ...current, to: event.target.value }));
                }}
              />
            </label>
          </div>

          <div className="reports-preset-list" aria-label="Periodes rapides">
            <button
              type="button"
              className={`app-btn ${activePreset === '7d' ? 'app-btn--primary' : 'app-btn--secondary'}`}
              onClick={() => applyPreset('7d')}
            >
              7 jours
            </button>
            <button
              type="button"
              className={`app-btn ${activePreset === '30d' ? 'app-btn--primary' : 'app-btn--secondary'}`}
              onClick={() => applyPreset('30d')}
            >
              30 jours
            </button>
            <button
              type="button"
              className={`app-btn ${activePreset === '90d' ? 'app-btn--primary' : 'app-btn--secondary'}`}
              onClick={() => applyPreset('90d')}
            >
              90 jours
            </button>
          </div>
        </div>
      </section>

      <section className="app-dashboard-grid">
        <article className="panel app-stat-card">
          <span className="eyebrow">Revenu total</span>
          <strong>{isLoading ? '...' : formatCurrency(salesReport?.totalRevenue ?? 0)}</strong>
          <p>Montant cumule sur la periode selectionnee.</p>
        </article>

        <article className="panel app-stat-card">
          <span className="eyebrow">Transactions</span>
          <strong>{isLoading ? '...' : salesReport?.totalTransactions ?? 0}</strong>
          <p>Nombre total de ventes completees.</p>
        </article>

        <article className="panel app-stat-card">
          <span className="eyebrow">Panier moyen</span>
          <strong>{isLoading ? '...' : formatCurrency(averageBasket)}</strong>
          <p>Valeur moyenne de chaque ticket sur cette periode.</p>
        </article>

        <article className="panel app-stat-card">
          <span className="eyebrow">Points de vigilance</span>
          <strong>{isLoading ? '...' : lowStockCount + expiringSoonCount}</strong>
          <p>
            {lowStockCount + expiringSoonCount > 0 ? (
              <Link href="/inventaire" className="reports-inline-link">
                Voir les alertes stock dans l&apos;inventaire
              </Link>
            ) : (
              'Aucun produit critique a signaler pour le moment.'
            )}
          </p>
        </article>
      </section>

      <section className="panel reports-chart-panel">
        <div className="inventory-table-head">
          <div>
            <h2>Evolution du revenu journalier</h2>
            <p>Visualisez les variations de revenus et le rythme des ventes jour apres jour.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="reports-empty-copy">Chargement du graphique...</p>
        ) : chartData.length === 0 ? (
          <p className="reports-empty-copy">Aucune vente disponible sur cette periode.</p>
        ) : (
          <div className="reports-chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'var(--text-soft)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--text-soft)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'transactions' ? Number(value) : formatCurrency(Number(value)),
                    name === 'transactions' ? 'Transactions' : 'Revenu',
                  ]}
                  labelStyle={{ fontWeight: 700 }}
                  contentStyle={{
                    borderRadius: '1rem',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-soft)',
                  }}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {!isLoading && lowStockCount > 0 ? (
        <section className="panel">
          <div className="inventory-table-head">
            <div>
              <h2>Produits en stock faible</h2>
              <p>Ces produits meritent un reaprovisionnement rapide pour eviter les ruptures.</p>
            </div>
          </div>

          <div className="app-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Categorie</th>
                  <th>Stock actuel</th>
                  <th>Seuil</th>
                  <th>Unite</th>
                </tr>
              </thead>
              <tbody>
                {inventoryReport!.lowStock.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.categoryName}</td>
                    <td className="reports-cell-highlight">{item.currentStock}</td>
                    <td>{item.lowStockThreshold}</td>
                    <td>{item.unit ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!isLoading && expiringSoonCount > 0 ? (
        <section className="panel">
          <div className="inventory-table-head">
            <div>
              <h2>Produits proches de l&apos;expiration</h2>
              <p>Anticipez les pertes et les rotations de stock sur les references sensibles.</p>
            </div>
          </div>

          <div className="app-table-wrapper">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Categorie</th>
                  <th>Stock</th>
                  <th>Date d&apos;expiration</th>
                </tr>
              </thead>
              <tbody>
                {inventoryReport!.expiringSoon.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.categoryName}</td>
                    <td>{item.currentStock}</td>
                    <td className="reports-cell-highlight">
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString('fr-MA')
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
