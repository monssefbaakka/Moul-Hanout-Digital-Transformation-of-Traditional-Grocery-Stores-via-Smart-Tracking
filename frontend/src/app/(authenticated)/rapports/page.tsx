'use client';

import { useCallback, useEffect, useState } from 'react';
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

function toIsoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function defaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

function formatCurrency(n: number) {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';
}

export default function RapportsPage() {
  const [range, setRange] = useState(defaultRange);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      reportsApi.salesReport({ from: range.from, to: range.to }),
      reportsApi.inventoryReport(),
    ])
      .then(([sales, inventory]) => {
        setSalesReport(sales);
        setInventoryReport(inventory);
      })
      .catch(() => setError('Impossible de charger les rapports.'))
      .finally(() => setLoading(false));
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    setExporting(true);
    try {
      await reportsApi.exportSalesCsv({ from: range.from, to: range.to });
    } catch {
      setError('Echec de l\'export CSV.');
    } finally {
      setExporting(false);
    }
  }

  const chartData = (salesReport?.days ?? []).map((d) => ({
    date: d.date.slice(5),
    revenu: Math.round(d.revenue * 100) / 100,
    transactions: d.transactions,
  }));

  return (
    <main className="page stack app-page">
      <AppPageHeader
        title="Rapports"
        subtitle="Analysez les ventes et l'etat du stock sur la periode choisie."
        actions={
          <button
            type="button"
            className="button-link"
            onClick={handleExport}
            disabled={exporting || loading}
          >
            {exporting ? 'Export...' : 'Exporter CSV'}
          </button>
        }
      />

      {error && (
        <div className="app-alert app-alert--danger" role="alert">
          {error}
        </div>
      )}

      {/* Date range */}
      <section className="panel stack" style={{ gap: 'var(--space-4)' }}>
        <h2 style={{ margin: 0 }}>Periode</h2>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: '0.875rem' }}>
            Du
            <input
              type="date"
              className="input"
              value={range.from}
              max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: '0.875rem' }}>
            Au
            <input
              type="date"
              className="input"
              value={range.to}
              min={range.from}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            />
          </label>
        </div>
      </section>

      {/* Summary cards */}
      <section className="app-dashboard-grid">
        <article className="panel app-stat-card">
          <span className="eyebrow">Revenu total</span>
          <strong>{loading ? '…' : formatCurrency(salesReport?.totalRevenue ?? 0)}</strong>
          <p>Sur la periode selectionnee.</p>
        </article>
        <article className="panel app-stat-card">
          <span className="eyebrow">Transactions</span>
          <strong>{loading ? '…' : (salesReport?.totalTransactions ?? 0)}</strong>
          <p>Ventes completees.</p>
        </article>
        <article className="panel app-stat-card">
          <span className="eyebrow">Stock faible</span>
          <strong>{loading ? '…' : (inventoryReport?.lowStock.length ?? 0)}</strong>
          <p>
            {(inventoryReport?.lowStock.length ?? 0) > 0 ? (
              <Link href="/inventaire" style={{ color: 'inherit', textDecoration: 'underline' }}>
                Voir l&apos;inventaire
              </Link>
            ) : (
              'Tout est bien approvisionne.'
            )}
          </p>
        </article>
      </section>

      {/* Bar chart */}
      <section className="panel stack" style={{ gap: 'var(--space-4)' }}>
        <h2 style={{ margin: 0 }}>Revenu par jour</h2>
        {loading ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Chargement…</p>
        ) : chartData.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)' }}>Aucune vente sur cette periode.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Revenu']}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem',
                }}
              />
              <Bar dataKey="revenu" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Low-stock table */}
      {!loading && (inventoryReport?.lowStock.length ?? 0) > 0 && (
        <section className="panel stack" style={{ gap: 'var(--space-4)' }}>
          <h2 style={{ margin: 0 }}>Produits en stock faible</h2>
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
                    <td style={{ color: '#9c3636', fontWeight: 600 }}>{item.currentStock}</td>
                    <td>{item.lowStockThreshold}</td>
                    <td>{item.unit ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Expiring soon table */}
      {!loading && (inventoryReport?.expiringSoon.length ?? 0) > 0 && (
        <section className="panel stack" style={{ gap: 'var(--space-4)' }}>
          <h2 style={{ margin: 0 }}>Produits proches de l&apos;expiration</h2>
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
                    <td style={{ color: '#9c3636', fontWeight: 600 }}>
                      {item.expirationDate
                        ? new Date(item.expirationDate).toLocaleDateString('fr-MA')
                        : '—'}
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
