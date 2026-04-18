'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InventoryItem } from '@moul-hanout/shared-types';
import { ApiError, inventoryApi } from '@/lib/api/api-client';
import { AppPageHeader } from '@/components/layout/app-page-header';
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
  if (!dateValue) {
    return undefined;
  }

  return new Date(`${dateValue}T00:00:00.000Z`).toISOString();
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) {
    return 'Not tracked';
  }

  return new Date(dateValue).toLocaleDateString();
}

function getInventoryTone(item: InventoryItem) {
  if (item.isExpiringSoon) {
    return 'inventory-status inventory-status-warning';
  }

  if (item.isLowStock) {
    return 'inventory-status inventory-status-danger';
  }

  return 'inventory-status inventory-status-success';
}

function getInventoryLabel(item: InventoryItem) {
  if (item.isExpiringSoon) {
    return 'Expiring soon';
  }

  if (item.isLowStock) {
    return 'Low stock';
  }

  return 'Healthy';
}

export function InventoryWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<InventoryItem[]>([]);
  const [stockInForm, setStockInForm] = useState<StockInFormState>(INITIAL_STOCK_IN_FORM);
  const [stockOutForm, setStockOutForm] = useState<StockOutFormState>(INITIAL_STOCK_OUT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    let isMounted = true;

    async function loadInventory() {
      try {
        const [inventoryItems, expiringItems] = await Promise.all([
          inventoryApi.list(),
          isOwner ? inventoryApi.expiringSoon() : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        setInventory(inventoryItems);
        setExpiringSoon(expiringItems);
        setStockInForm((current) => ({
          ...current,
          productId: current.productId || inventoryItems[0]?.id || '',
        }));
        setStockOutForm((current) => ({
          ...current,
          productId: current.productId || inventoryItems[0]?.id || '',
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load inventory right now.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isAuthenticated, isOwner, router]);

  async function refreshInventory(productIdFallback?: string) {
    const [inventoryItems, expiringItems] = await Promise.all([
      inventoryApi.list(),
      isOwner ? inventoryApi.expiringSoon() : Promise.resolve([]),
    ]);

    setInventory(inventoryItems);
    setExpiringSoon(expiringItems);
    setStockInForm((current) => ({
      ...current,
      productId: inventoryItems.some((item) => item.id === current.productId)
        ? current.productId
        : productIdFallback || inventoryItems[0]?.id || '',
    }));
    setStockOutForm((current) => ({
      ...current,
      productId: inventoryItems.some((item) => item.id === current.productId)
        ? current.productId
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
        ...(stockInForm.expirationDate
          ? { expirationDate: toIsoDate(stockInForm.expirationDate) }
          : {}),
      });

      await refreshInventory(updatedItem.id);
      setStatusMessage(`Added stock to ${updatedItem.name}. New stock: ${updatedItem.currentStock}.`);
      setStockInForm((current) => ({
        ...INITIAL_STOCK_IN_FORM,
        productId: current.productId || updatedItem.id,
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to add stock right now.');
      }
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
      setStatusMessage(
        `Removed stock from ${updatedItem.name}. Remaining stock: ${updatedItem.currentStock}.`,
      );
      setStockOutForm((current) => ({
        ...INITIAL_STOCK_OUT_FORM,
        productId: current.productId || updatedItem.id,
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to remove stock right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="page">
        <section className="panel">
          <p>Loading inventory...</p>
        </section>
      </main>
    );
  }

  const lowStockCount = inventory.filter((item) => item.isLowStock).length;

  return (
    <main className="page stack app-page">
      <AppPageHeader
        eyebrow="Inventaire"
        title={isOwner ? 'Suivi du stock magasin' : 'Lecture du stock disponible'}
        description={
          isOwner
            ? 'Suivez les quantites disponibles, enregistrez les entrees et sorties, et surveillez les produits a risque.'
            : 'Consultez rapidement les niveaux de stock avant la vente. Les modifications restent reservees au proprietaire.'
        }
      />

      <section className="status-grid">
        <article className="panel">
          <h2>Produits actifs</h2>
          <p className="inventory-kpi">{inventory.length}</p>
        </article>

        <article className="panel">
          <h2>Stock bas</h2>
          <p className="inventory-kpi">{lowStockCount}</p>
        </article>

        <article className="panel">
          <h2>Expiration 5 jours</h2>
          <p className="inventory-kpi">{isOwner ? expiringSoon.length : 'Reserve owner'}</p>
        </article>
      </section>

      {statusMessage ? <p className="status-success">{statusMessage}</p> : null}
      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}

      {isOwner ? (
        <section className="products-layout inventory-owner-layout">
          <article className="panel">
            <h2>Entree de stock</h2>
            <form className="form-grid" onSubmit={handleStockIn}>
              <label className="field">
                <span>Produit</span>
                <select
                  value={stockInForm.productId}
                  onChange={(event) =>
                    setStockInForm({ ...stockInForm, productId: event.target.value })
                  }
                  required
                  disabled={isSubmitting || isLoading}
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Quantite</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={stockInForm.quantity}
                  onChange={(event) =>
                    setStockInForm({ ...stockInForm, quantity: event.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </label>

              <label className="field field-wide">
                <span>Motif</span>
                <input
                  value={stockInForm.reason}
                  onChange={(event) =>
                    setStockInForm({ ...stockInForm, reason: event.target.value })
                  }
                  placeholder="Morning delivery received"
                  required
                  disabled={isSubmitting}
                />
              </label>

              <label className="field field-wide">
                <span>Date d&apos;expiration</span>
                <input
                  type="date"
                  value={stockInForm.expirationDate}
                  onChange={(event) =>
                    setStockInForm({ ...stockInForm, expirationDate: event.target.value })
                  }
                  disabled={isSubmitting}
                />
              </label>

              <div className="form-actions field-wide">
                <button className="button-link" type="submit" disabled={isSubmitting || !inventory.length}>
                  {isSubmitting ? 'Enregistrement...' : 'Valider entree'}
                </button>
              </div>
            </form>
          </article>

          <article className="panel">
            <h2>Sortie de stock</h2>
            <form className="form-grid" onSubmit={handleStockOut}>
              <label className="field">
                <span>Produit</span>
                <select
                  value={stockOutForm.productId}
                  onChange={(event) =>
                    setStockOutForm({ ...stockOutForm, productId: event.target.value })
                  }
                  required
                  disabled={isSubmitting || isLoading}
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Quantite</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={stockOutForm.quantity}
                  onChange={(event) =>
                    setStockOutForm({ ...stockOutForm, quantity: event.target.value })
                  }
                  required
                  disabled={isSubmitting}
                />
              </label>

              <label className="field field-wide">
                <span>Motif</span>
                <input
                  value={stockOutForm.reason}
                  onChange={(event) =>
                    setStockOutForm({ ...stockOutForm, reason: event.target.value })
                  }
                  placeholder="Damaged item removed"
                  required
                  disabled={isSubmitting}
                />
              </label>

              <div className="form-actions field-wide">
                <button className="button-link secondary" type="submit" disabled={isSubmitting || !inventory.length}>
                  {isSubmitting ? 'Enregistrement...' : 'Valider sortie'}
                </button>
              </div>
            </form>
          </article>
        </section>
      ) : null}

      {isOwner ? (
        <section className="panel">
          <h2>Produits a surveiller</h2>
          <div className="inventory-expiring-grid">
            {expiringSoon.length === 0 ? (
              <p>No active products are expiring within the next 5 days.</p>
            ) : (
              expiringSoon.map((item) => (
                <article key={item.id} className="inventory-expiring-card">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.categoryName}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Stock</dt>
                      <dd>{item.currentStock}</dd>
                    </div>
                    <div>
                      <dt>Expires</dt>
                      <dd>{formatDate(item.expirationDate)}</dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="inventory-table-head">
          <div>
            <h2>Stock actuel</h2>
            <p>
              {isOwner
                ? "Suivez les quantites faibles et les dates sensibles avant les operations de vente."
                : "Consultez ce tableau pour verifier la disponibilite avant de lancer une vente."}
            </p>
          </div>
        </div>

        {isLoading ? <p>Loading stock data...</p> : null}
        {!isLoading && inventory.length === 0 ? <p>No active inventory items found.</p> : null}

        {!isLoading && inventory.length > 0 ? (
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <span>{item.barcode || item.unit || 'No barcode'}</span>
                    </td>
                    <td>{item.categoryName}</td>
                    <td>{item.currentStock}</td>
                    <td>{item.lowStockThreshold}</td>
                    <td>{formatDate(item.expirationDate)}</td>
                    <td>
                      <span className={getInventoryTone(item)}>{getInventoryLabel(item)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
