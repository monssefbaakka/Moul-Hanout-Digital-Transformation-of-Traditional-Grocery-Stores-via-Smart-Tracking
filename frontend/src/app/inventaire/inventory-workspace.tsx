'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  Package2,
  Search,
  Plus,
  Download,
  Lightbulb,
  X,
  ArrowDown,
  ArrowUp,
  ChevronDown,
} from 'lucide-react';
import type { InventoryItem } from '@moul-hanout/shared-types';
import { ApiError, inventoryApi } from '@/lib/api/api-client';
import { useAuthStore } from '@/store/auth.store';

type StockInFormState = {
  productId: string;
  quantity: string;
  reason: string;
  expirationDate: string;
};

type StockOutFormState = {
  productId: string;
  quantity: string;
  reason: string;
};

const INITIAL_STOCK_IN_FORM: StockInFormState = {
  productId: '',
  quantity: '',
  reason: '',
  expirationDate: '',
};

const INITIAL_STOCK_OUT_FORM: StockOutFormState = {
  productId: '',
  quantity: '',
  reason: '',
};

function toIsoDate(dateValue: string) {
  if (!dateValue) return undefined;
  return new Date(`${dateValue}T00:00:00.000Z`).toISOString();
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return 'Non suivi';
  return new Date(dateValue).toLocaleDateString('fr-MA');
}

function getStockStatus(item: InventoryItem): 'out' | 'low' | 'ok' | 'expiring' {
  if (item.currentStock === 0) return 'out';
  if (item.isExpiringSoon) return 'expiring';
  if (item.isLowStock) return 'low';
  return 'ok';
}

function getStockBarWidth(item: InventoryItem): number {
  const threshold = Math.max(item.lowStockThreshold, 1);
  return Math.min(100, Math.round((item.currentStock / threshold) * 100));
}

function getCategoryClass(name: string): string {
  const palette = [
    'inv-cat-1',
    'inv-cat-2',
    'inv-cat-3',
    'inv-cat-4',
    'inv-cat-5',
    'inv-cat-6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function InventoryWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<InventoryItem[]>([]);
  const [stockInForm, setStockInForm] = useState<StockInFormState>(INITIAL_STOCK_IN_FORM);
  const [stockOutForm, setStockOutForm] = useState<StockOutFormState>(INITIAL_STOCK_OUT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tous');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low' | 'out'>('all');
  const [activeFormTab, setActiveFormTab] = useState<'in' | 'out'>('in');
  const [showForms, setShowForms] = useState(false);
  const [dismissInsight, setDismissInsight] = useState(false);

  const isOwner = user?.role === 'OWNER';
  const focusedProductId = searchParams.get('focus') ?? '';

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }

    let isMounted = true;

    async function loadInventory() {
      try {
        const [inventoryItems, expiringItems] = await Promise.all([
          inventoryApi.list(),
          isOwner ? inventoryApi.expiringSoon() : Promise.resolve([]),
        ]);
        if (!isMounted) return;
        setInventory(inventoryItems);
        setExpiringSoon(expiringItems);
        setStockInForm((c) => ({ ...c, productId: c.productId || inventoryItems[0]?.id || '' }));
        setStockOutForm((c) => ({ ...c, productId: c.productId || inventoryItems[0]?.id || '' }));
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger le stock.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadInventory();
    return () => { isMounted = false; };
  }, [hasHydrated, isAuthenticated, isOwner, router]);

  async function refreshInventory(productIdFallback?: string) {
    const [inventoryItems, expiringItems] = await Promise.all([
      inventoryApi.list(),
      isOwner ? inventoryApi.expiringSoon() : Promise.resolve([]),
    ]);
    setInventory(inventoryItems);
    setExpiringSoon(expiringItems);
    setStockInForm((c) => ({
      ...c,
      productId: inventoryItems.some((i) => i.id === c.productId)
        ? c.productId
        : productIdFallback || inventoryItems[0]?.id || '',
    }));
    setStockOutForm((c) => ({
      ...c,
      productId: inventoryItems.some((i) => i.id === c.productId)
        ? c.productId
        : productIdFallback || inventoryItems[0]?.id || '',
    }));
  }

  async function handleStockIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const updatedItem = await inventoryApi.stockIn({
        productId: stockInForm.productId,
        quantity: Number(stockInForm.quantity),
        reason: stockInForm.reason.trim(),
        ...(stockInForm.expirationDate ? { expirationDate: toIsoDate(stockInForm.expirationDate) } : {}),
      });
      await refreshInventory(updatedItem.id);
      setStatusMessage(`Stock mis à jour pour ${updatedItem.name}. Nouveau stock : ${updatedItem.currentStock}.`);
      setStockInForm((c) => ({ ...INITIAL_STOCK_IN_FORM, productId: c.productId || updatedItem.id }));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Impossible d'ajouter le stock.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStockOut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const updatedItem = await inventoryApi.stockOut({
        productId: stockOutForm.productId,
        quantity: Number(stockOutForm.quantity),
        reason: stockOutForm.reason.trim(),
      });
      await refreshInventory(updatedItem.id);
      setStatusMessage(`Stock retiré pour ${updatedItem.name}. Restant : ${updatedItem.currentStock}.`);
      setStockOutForm((c) => ({ ...INITIAL_STOCK_OUT_FORM, productId: c.productId || updatedItem.id }));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Impossible de retirer le stock.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const outOfStockCount = inventory.filter((i) => i.currentStock === 0).length;
  const lowStockCount = inventory.filter((i) => i.isLowStock).length;

  const categories = useMemo(() => {
    const cats = Array.from(new Set(inventory.map((i) => i.categoryName).filter(Boolean)));
    return ['Tous', ...cats];
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(q) ||
        (item.barcode?.toLowerCase().includes(q));
      const matchesCategory = categoryFilter === 'Tous' || item.categoryName === categoryFilter;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in-stock' && !item.isLowStock && item.currentStock > 0) ||
        (stockFilter === 'low' && item.isLowStock && item.currentStock > 0) ||
        (stockFilter === 'out' && item.currentStock === 0);
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [inventory, searchQuery, categoryFilter, stockFilter]);

  useEffect(() => {
    if (!focusedProductId || isLoading) {
      return;
    }

    const targetRow = document.getElementById(`inventory-item-${focusedProductId}`);

    if (!targetRow) {
      return;
    }

    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [filteredInventory, focusedProductId, isLoading]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="inv-page">
        <div className="inv-loading">Chargement de l&apos;inventaire...</div>
      </main>
    );
  }

  const insightLowCount = expiringSoon.length;

  return (
    <main className="inv-page" role="main">
      {/* ── Header ── */}
      <header className="inv-header">
        <div className="inv-header-left">
          <h1 className="inv-title">Vue d&apos;ensemble du stock</h1>
          <p className="inv-subtitle">
            Statut en temps réel de{' '}
            <strong>{inventory.length}</strong> produits
            {categories.length > 2 ? ` dans ${categories.length - 1} catégories` : ''}.
          </p>
        </div>
        <div className="inv-header-actions">
          <button className="inv-btn-secondary" type="button" disabled title="Export d'inventaire bientot disponible">
            <Download size={16} />
            <span>Export bientot</span>
          </button>
          {isOwner && (
            <button
              className="inv-btn-primary"
              type="button"
              onClick={() => { setShowForms((v) => !v); setActiveFormTab('in'); }}
            >
              <Plus size={16} />
              <span>{showForms ? 'Masquer le formulaire' : 'Mouvement de stock'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ── KPI Cards ── */}
      <section className="inv-kpi-grid" aria-label="Indicateurs clés">
        <article className="inv-kpi-card inv-kpi-danger">
          <div className="inv-kpi-card-inner">
            <div>
              <p className="inv-kpi-label">RUPTURE DE STOCK</p>
              <p className="inv-kpi-value">{outOfStockCount}</p>
              {outOfStockCount > 0 && (
                <p className="inv-kpi-hint">Action immédiate requise</p>
              )}
            </div>
            <div className="inv-kpi-icon inv-kpi-icon-danger">
              <AlertCircle size={22} />
            </div>
          </div>
        </article>

        <article className="inv-kpi-card inv-kpi-warning">
          <div className="inv-kpi-card-inner">
            <div>
              <p className="inv-kpi-label">ALERTE STOCK BAS</p>
              <p className="inv-kpi-value">{lowStockCount}</p>
              {lowStockCount > 0 && (
                <p className="inv-kpi-hint">Réapprovisionnement recommandé</p>
              )}
            </div>
            <div className="inv-kpi-icon inv-kpi-icon-warning">
              <AlertTriangle size={22} />
            </div>
          </div>
        </article>

        <article className="inv-kpi-card inv-kpi-success">
          <div className="inv-kpi-card-inner">
            <div>
              <p className="inv-kpi-label">PRODUITS ACTIFS</p>
              <p className="inv-kpi-value">{inventory.length}</p>
              {isOwner && expiringSoon.length > 0 && (
                <p className="inv-kpi-hint">+{expiringSoon.length} expirant bientôt</p>
              )}
            </div>
            <div className="inv-kpi-icon inv-kpi-icon-success">
              <Package2 size={22} />
            </div>
          </div>
        </article>
      </section>

      {/* ── Status messages ── */}
      {statusMessage && (
        <div className="inv-alert inv-alert-success" role="status">
          {statusMessage}
          <button onClick={() => setStatusMessage(null)} aria-label="Fermer"><X size={14} /></button>
        </div>
      )}
      {errorMessage && (
        <div className="inv-alert inv-alert-error" role="alert">
          {errorMessage}
          <button onClick={() => setErrorMessage(null)} aria-label="Fermer"><X size={14} /></button>
        </div>
      )}

      {/* ── Stock movement forms (owner only) ── */}
      {isOwner && showForms && (
        <section className="inv-forms-panel" aria-label="Mouvement de stock">
          <div className="inv-forms-header">
            <div className="inv-tab-bar">
              <button
                className={`inv-tab ${activeFormTab === 'in' ? 'inv-tab-active' : ''}`}
                type="button"
                onClick={() => setActiveFormTab('in')}
              >
                <ArrowDown size={15} />
                Entrée de stock
              </button>
              <button
                className={`inv-tab ${activeFormTab === 'out' ? 'inv-tab-active inv-tab-active-out' : ''}`}
                type="button"
                onClick={() => setActiveFormTab('out')}
              >
                <ArrowUp size={15} />
                Sortie de stock
              </button>
            </div>
            <button className="inv-close-btn" onClick={() => setShowForms(false)} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>

          {activeFormTab === 'in' && (
            <form className="inv-form-grid" onSubmit={handleStockIn}>
              <label className="inv-field">
                <span>Produit</span>
                <select
                  value={stockInForm.productId}
                  onChange={(e) => setStockInForm({ ...stockInForm, productId: e.target.value })}
                  required
                  disabled={isSubmitting || isLoading}
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className="inv-field">
                <span>Quantité</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={stockInForm.quantity}
                  onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </label>
              <label className="inv-field inv-field-wide">
                <span>Motif</span>
                <input
                  value={stockInForm.reason}
                  onChange={(e) => setStockInForm({ ...stockInForm, reason: e.target.value })}
                  placeholder="Ex : Livraison matinale reçue"
                  required
                  disabled={isSubmitting}
                />
              </label>
              <label className="inv-field inv-field-wide">
                <span>Date d&apos;expiration</span>
                <input
                  type="date"
                  value={stockInForm.expirationDate}
                  onChange={(e) => setStockInForm({ ...stockInForm, expirationDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </label>
              <div className="inv-form-actions">
                <button className="inv-submit-btn inv-submit-in" type="submit" disabled={isSubmitting || !inventory.length}>
                  {isSubmitting ? 'Enregistrement...' : 'Valider l\'entrée'}
                </button>
              </div>
            </form>
          )}

          {activeFormTab === 'out' && (
            <form className="inv-form-grid" onSubmit={handleStockOut}>
              <label className="inv-field">
                <span>Produit</span>
                <select
                  value={stockOutForm.productId}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, productId: e.target.value })}
                  required
                  disabled={isSubmitting || isLoading}
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label className="inv-field">
                <span>Quantité</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={stockOutForm.quantity}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </label>
              <label className="inv-field inv-field-wide">
                <span>Motif</span>
                <input
                  value={stockOutForm.reason}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, reason: e.target.value })}
                  placeholder="Ex : Article endommagé retiré"
                  required
                  disabled={isSubmitting}
                />
              </label>
              <div className="inv-form-actions">
                <button className="inv-submit-btn inv-submit-out" type="submit" disabled={isSubmitting || !inventory.length}>
                  {isSubmitting ? 'Enregistrement...' : 'Valider la sortie'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ── Expiring soon (owner) ── */}
      {isOwner && expiringSoon.length > 0 && (
        <section className="inv-expiring-section" aria-label="Produits à surveiller">
          <h2 className="inv-section-title">Produits à surveiller</h2>
          <div className="inv-expiring-grid">
            {expiringSoon.map((item) => (
              <article key={item.id} className="inv-expiring-card">
                <div className="inv-expiring-dot" />
                <div className="inv-expiring-info">
                  <p className="inv-expiring-name">{item.name}</p>
                  <p className="inv-expiring-cat">{item.categoryName}</p>
                </div>
                <dl className="inv-expiring-dl">
                  <div>
                    <dt>Stock</dt>
                    <dd>{item.currentStock}</dd>
                  </div>
                  <div>
                    <dt>Expire le</dt>
                    <dd>{formatDate(item.expirationDate)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Main table ── */}
      <section className="inv-table-section">
        {/* Filter bar */}
        <div className="inv-filter-bar">
          <div className="inv-search-wrap">
            <Search size={16} className="inv-search-icon" />
            <input
              className="inv-search-input"
              type="search"
              placeholder="Rechercher un produit ou un code-barres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher dans le catalogue"
            />
          </div>

          <div className="inv-filter-right">
            <div className="inv-category-select-wrap">
              <select
                className="inv-category-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filtrer par catégorie"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown size={14} className="inv-select-chevron" />
            </div>

            <div className="inv-stock-chips" role="group" aria-label="Filtrer par statut de stock">
              {(['all', 'in-stock', 'low', 'out'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`inv-chip ${stockFilter === f ? 'inv-chip-active' : ''}`}
                  onClick={() => setStockFilter(f)}
                >
                  {f === 'all' ? 'Tous' : f === 'in-stock' ? 'En stock' : f === 'low' ? 'Bas' : 'Rupture'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="inv-table-title-row">
          <div>
            <h2 className="inv-section-title">Liste principale du stock</h2>
            {!isLoading && (
              <p className="inv-table-count">
                {filteredInventory.length === inventory.length
                  ? `Affichage de ${inventory.length} produits`
                  : `${filteredInventory.length} résultat${filteredInventory.length !== 1 ? 's' : ''} sur ${inventory.length}`}
              </p>
            )}
          </div>
        </div>

        {isLoading && <div className="inv-loading">Chargement des stocks...</div>}
        {!isLoading && inventory.length === 0 && (
          <div className="inv-empty">Aucun article actif dans le stock.</div>
        )}
        {!isLoading && inventory.length > 0 && filteredInventory.length === 0 && (
          <div className="inv-empty">Aucun produit ne correspond aux filtres sélectionnés.</div>
        )}

        {!isLoading && filteredInventory.length > 0 && (
          <div className="inv-table-wrapper">
            <table className="inv-table" aria-label="Liste des produits en stock">
              <thead>
                <tr>
                  <th>Détails de l&apos;article</th>
                  <th>Catégorie</th>
                  <th>Niveau de stock</th>
                  <th>Expiration</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  const barWidth = getStockBarWidth(item);
                  return (
                    <tr
                      key={item.id}
                      id={`inventory-item-${item.id}`}
                      className={`inv-tr${focusedProductId === item.id ? ' is-highlighted' : ''}`}
                    >
                      <td className="inv-td-product">
                        <div className="inv-product-icon">
                          <Package2 size={18} />
                        </div>
                        <div>
                          <p className="inv-product-name">{item.name}</p>
                          <p className="inv-product-sub">
                            {item.barcode ? item.barcode : item.unit || 'Sans code-barres'}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className={`inv-cat-badge ${getCategoryClass(item.categoryName ?? '')}`}>
                          {item.categoryName ?? '—'}
                        </span>
                      </td>
                      <td className="inv-td-stock">
                        <div className="inv-stock-row">
                          <span className={`inv-stock-badge inv-stock-${status}`}>
                            {status === 'out'
                              ? 'Rupture'
                              : status === 'low'
                              ? 'Stock Bas'
                              : status === 'expiring'
                              ? 'Expire bientôt'
                              : 'En Stock'}
                          </span>
                          <span className="inv-stock-numbers">
                            {item.currentStock} / {item.lowStockThreshold}
                          </span>
                        </div>
                        <div className="inv-bar-track" aria-hidden="true">
                          <div
                            className={`inv-bar-fill inv-bar-${status}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                      <td className="inv-td-date">{formatDate(item.expirationDate)}</td>
                      <td>
                        <span className={`inv-status-badge inv-status-${status}`}>
                          {status === 'out'
                            ? 'Rupture de stock'
                            : status === 'low'
                            ? 'Stock bas'
                            : status === 'expiring'
                            ? 'Expire bientôt'
                            : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── System insight banner ── */}
      {!dismissInsight && lowStockCount > 0 && (
        <aside className="inv-insight" role="complementary" aria-label="Conseil système">
          <div className="inv-insight-icon">
            <Lightbulb size={20} />
          </div>
          <div className="inv-insight-body">
            <p className="inv-insight-title">Aperçu système</p>
            <p className="inv-insight-text">
              <strong>{lowStockCount} produit{lowStockCount > 1 ? 's' : ''}</strong> en stock bas
              {expiringSoon.length > 0 && isOwner
                ? ` et ${expiringSoon.length} expirant bientôt`
                : ''}.{' '}
              Nous recommandons de passer commande auprès de vos fournisseurs pour éviter les ruptures.
            </p>
          </div>
          <button
            className="inv-insight-dismiss"
            onClick={() => setDismissInsight(true)}
            aria-label="Ignorer le conseil"
          >
            IGNORER
          </button>
        </aside>
      )}
    </main>
  );
}
