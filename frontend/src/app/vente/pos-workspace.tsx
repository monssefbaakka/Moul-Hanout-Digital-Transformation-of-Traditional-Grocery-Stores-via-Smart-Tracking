'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CreditCard,
  PackageSearch,
  Pause,
  ReceiptText,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import type { PaymentMode, Product, SaleDetail } from '@moul-hanout/shared-types';
import { ApiError, productsApi, salesApi } from '@/lib/api/api-client';
import { useAuthStore } from '@/store/auth.store';

type CartItem = {
  productId: string;
  name: string;
  barcode?: string | null;
  unit?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
};

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'CARD', 'OTHER'];

const CATEGORY_GRADIENTS = [
  'linear-gradient(145deg, #d4f1e4 0%, #86efac 100%)',
  'linear-gradient(145deg, #fef9c3 0%, #fde047 80%)',
  'linear-gradient(145deg, #dbeafe 0%, #93c5fd 100%)',
  'linear-gradient(145deg, #fed7aa 0%, #fb923c 100%)',
  'linear-gradient(145deg, #f3e8ff 0%, #d8b4fe 100%)',
  'linear-gradient(145deg, #fce7f3 0%, #fbcfe8 100%)',
  'linear-gradient(145deg, #ccfbf1 0%, #5eead4 100%)',
  'linear-gradient(145deg, #e0f2fe 0%, #7dd3fc 100%)',
];

function getCategoryGradient(categoryName?: string | null): string {
  if (!categoryName) return 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)';
  const hash = Array.from(categoryName).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CATEGORY_GRADIENTS[hash % CATEGORY_GRADIENTS.length];
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('fr-MA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getPaymentModeLabel(mode: PaymentMode) {
  switch (mode) {
    case 'CASH': return 'Espèces';
    case 'CARD': return 'Carte';
    case 'OTHER': return 'Autre';
    default: return mode;
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'MH';
}

function toCartItem(product: Product): CartItem {
  return {
    productId: product.id,
    name: product.name,
    barcode: product.barcode,
    unit: product.unit,
    unitPrice: product.salePrice,
    quantity: 1,
    lineTotal: product.salePrice,
    availableStock: product.currentStock,
  };
}

const TAX_RATE = 0.2;

export function PosWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [receipt, setReceipt] = useState<SaleDetail | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }

    let isMounted = true;

    async function loadProducts() {
      try {
        const list = await productsApi.list();
        if (!isMounted) return;
        setProducts(list.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(err instanceof Error ? err.message : 'Impossible de charger le catalogue.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProducts();
    return () => { isMounted = false; };
  }, [hasHydrated, isAuthenticated, router]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => { if (p.category?.name) cats.add(p.category.name); });
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        [p.name, p.barcode, p.category?.name]
          .filter(Boolean)
          .some((v) => v!.toLowerCase().includes(q));
      const matchesCategory =
        activeCategory === 'all' || p.category?.name === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [deferredSearchTerm, products, activeCategory]);

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartItems],
  );

  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const subtotalAmount = totalAmount / (1 + TAX_RATE);
  const taxAmount = totalAmount - subtotalAmount;

  function syncProductStock(updated: Product[]) {
    setCartItems((current) =>
      current
        .map((item) => {
          const product = updated.find((p) => p.id === item.productId);
          if (!product || product.currentStock <= 0) return null;
          const quantity = Math.min(item.quantity, product.currentStock);
          return {
            ...item,
            unitPrice: product.salePrice,
            availableStock: product.currentStock,
            quantity,
            lineTotal: quantity * product.salePrice,
          };
        })
        .filter((item): item is CartItem => item !== null),
    );
  }

  async function refreshProducts() {
    const list = await productsApi.list();
    const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
    setProducts(sorted);
    syncProductStock(sorted);
  }

  function addToCart(product: Product) {
    if (product.currentStock <= 0) {
      setErrorMessage(`${product.name} est en rupture de stock.`);
      return;
    }
    setErrorMessage(null);
    setStatusMessage(null);
    setCartItems((current) => {
      const existing = current.find((i) => i.productId === product.id);
      if (!existing) return [...current, toCartItem(product)];
      if (existing.quantity >= product.currentStock) {
        setErrorMessage(`Stock disponible atteint pour ${product.name}.`);
        return current;
      }
      return current.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, availableStock: product.currentStock, lineTotal: (i.quantity + 1) * i.unitPrice }
          : i,
      );
    });
  }

  function updateQuantity(productId: string, next: number) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (next <= 0) {
      setCartItems((c) => c.filter((i) => i.productId !== productId));
      return;
    }
    if (next > product.currentStock) {
      setErrorMessage(`Seulement ${product.currentStock} unité(s) disponible(s) pour ${product.name}.`);
      return;
    }
    setErrorMessage(null);
    setCartItems((c) =>
      c.map((i) =>
        i.productId === productId
          ? { ...i, quantity: next, availableStock: product.currentStock, unitPrice: product.salePrice, lineTotal: next * product.salePrice }
          : i,
      ),
    );
  }

  async function handleSubmitSale() {
    if (cartItems.length === 0) {
      setErrorMessage('Ajoutez au moins un produit avant de valider la vente.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const created = await salesApi.create({
        paymentMode,
        items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      await refreshProducts();
      setReceipt(created);
      setCartItems([]);
      setPaymentMode('CASH');
      setSearchTerm('');
      setStatusMessage(`La vente ${created.receiptNumber} a bien été enregistrée.`);
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.message : 'Impossible de valider la vente pour le moment.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="page">
        <section className="panel">
          <p>Chargement du point de vente...</p>
        </section>
      </main>
    );
  }

  const orderNumber = `CMD-${String(Math.floor(Math.random() * 90000) + 10000)}`;

  return (
    <>
      <main className="pos-v2">
        {statusMessage ? (
          <p className="pos-v2__status-success" role="status">{statusMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="pos-v2__status-error" role="alert">{errorMessage}</p>
        ) : null}

        <section className="pos-v2__layout">
          {/* ── Catalog ── */}
          <div className="pos-v2__catalog">
            {/* Category tabs + search */}
            <div className="pos-v2__filters">
              <div className="pos-v2__category-tabs" role="tablist" aria-label="Catégories">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === 'all'}
                  className={`pos-v2__cat-tab${activeCategory === 'all' ? ' is-active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  Tous les produits
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === cat}
                    className={`pos-v2__cat-tab${activeCategory === cat ? ' is-active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <label className="pos-v2__search" htmlFor="pos-v2-search">
                <Search size={15} aria-hidden="true" />
                <input
                  id="pos-v2-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, code-barres…"
                  autoComplete="off"
                />
              </label>
            </div>

            {/* Loading skeletons */}
            {isLoading ? (
              <div className="pos-v2__skeleton-grid" aria-busy="true" aria-label="Chargement des produits">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="pos-v2__skeleton-card" />
                ))}
              </div>
            ) : null}

            {/* Empty catalogue */}
            {!isLoading && products.length === 0 ? (
              <div className="pos-v2__empty-state">
                <PackageSearch size={32} aria-hidden="true" />
                <strong>Aucun produit actif</strong>
                <p>Ajoutez d&apos;abord des produits pour ouvrir la caisse.</p>
                <Link href="/produits" className="button-link">Gérer les produits</Link>
              </div>
            ) : null}

            {/* No search results */}
            {!isLoading && products.length > 0 && filteredProducts.length === 0 ? (
              <div className="pos-v2__empty-state">
                <PackageSearch size={32} aria-hidden="true" />
                <strong>Aucun résultat</strong>
                <p>Essayez un autre nom, un code-barres ou une catégorie.</p>
              </div>
            ) : null}

            {/* Product grid */}
            {!isLoading && filteredProducts.length > 0 ? (
              <div className="pos-v2__product-grid">
                {filteredProducts.map((product) => {
                  const cartItem = cartItems.find((i) => i.productId === product.id);
                  const remaining = product.currentStock - (cartItem?.quantity ?? 0);
                  const outOfStock = product.currentStock <= 0;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      className={`pos-v2__product-card${outOfStock ? ' is-out-of-stock' : ''}`}
                      onClick={() => addToCart(product)}
                      disabled={outOfStock || isSubmitting}
                      aria-label={`Ajouter ${product.name} au panier`}
                    >
                      {/* Image area */}
                      <div
                        className="pos-v2__product-img"
                        style={{ background: getCategoryGradient(product.category?.name) }}
                        aria-hidden="true"
                      >
                        <span className="pos-v2__product-img-letter">
                          {product.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="pos-v2__price-badge">
                          {formatMoney(product.salePrice)}
                        </span>
                        <span className={`pos-v2__stock-badge${outOfStock ? ' is-danger' : ''}`}>
                          {outOfStock ? 'Rupture' : `${remaining >= 0 ? remaining : 0} restant`}
                        </span>
                      </div>

                      {/* Text body */}
                      <div className="pos-v2__product-body">
                        <h3>{product.name}</h3>
                        <p>{product.category?.name ?? 'Non catégorisé'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* ── Order panel ── */}
          <aside className="pos-v2__order-panel" aria-label="Commande en cours">
            {/* Header */}
            <div className="pos-v2__order-header">
              <h2>Commande en cours</h2>
              <div className="pos-v2__order-header-meta">
                <span className="pos-v2__order-number">{orderNumber}</span>
                <span aria-hidden="true">·</span>
                <span className="pos-v2__order-status-pill">
                  {cartItems.length === 0 ? 'Panier vide' : 'En cours'}
                </span>
              </div>
            </div>

            {/* Cart items */}
            <div className="pos-v2__cart-items" role="list" aria-label="Articles dans le panier">
              {cartItems.length === 0 ? (
                <div className="pos-v2__cart-empty">
                  <ReceiptText size={22} aria-hidden="true" />
                  <p>Sélectionnez un produit pour démarrer.</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={item.productId} className="pos-v2__cart-item" role="listitem">
                    <span className="pos-v2__cart-item-qty" aria-hidden="true">{idx + 1}</span>

                    <div className="pos-v2__cart-item-info">
                      <strong>{item.name}</strong>
                      <span>{item.barcode ?? item.unit ?? 'Article standard'}</span>
                    </div>

                    <div className="pos-v2__cart-item-right">
                      <strong>{formatMoney(item.lineTotal)}</strong>
                      <div className="pos-v2__qty-ctrl" role="group" aria-label={`Quantité de ${item.name}`}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={isSubmitting}
                          aria-label={`Diminuer ${item.name}`}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={isSubmitting || item.quantity >= item.availableStock}
                          aria-label={`Augmenter ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="pos-v2__remove-btn"
                      onClick={() => updateQuantity(item.productId, 0)}
                      disabled={isSubmitting}
                      aria-label={`Retirer ${item.name} du panier`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pos-v2__divider" role="separator" />

            {/* Summary */}
            <div className="pos-v2__summary">
              <div className="pos-v2__summary-row">
                <span>Sous-total</span>
                <span>{formatMoney(subtotalAmount)}</span>
              </div>
              <div className="pos-v2__summary-row">
                <span>TVA (20%)</span>
                <span>{formatMoney(taxAmount)}</span>
              </div>
            </div>

            <div className="pos-v2__total-row">
              <span className="pos-v2__total-label">Total dû</span>
              <div style={{ textAlign: 'right' }}>
                <div className="pos-v2__total-amount">{formatMoney(totalAmount)}</div>
                {cartItems.length > 0 ? (
                  <span className="pos-v2__active-cart-badge">Panier actif</span>
                ) : null}
              </div>
            </div>

            {/* Payment mode */}
            <div className="pos-v2__payment-modes" role="radiogroup" aria-label="Mode de paiement">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`pos-v2__payment-pill${paymentMode === mode ? ' is-active' : ''}`}
                  onClick={() => setPaymentMode(mode)}
                  disabled={isSubmitting}
                  aria-pressed={paymentMode === mode}
                >
                  <CreditCard size={13} aria-hidden="true" />
                  <span>{getPaymentModeLabel(mode)}</span>
                </button>
              ))}
            </div>

            {/* Secondary actions */}
            <div className="pos-v2__order-actions">
              <button
                type="button"
                className="pos-v2__action-btn"
                disabled={cartItems.length === 0 || isSubmitting}
                title="Fonctionnalité à venir"
              >
                <Tag size={15} aria-hidden="true" />
                <span>Remise</span>
              </button>
              <button
                type="button"
                className="pos-v2__action-btn"
                disabled={cartItems.length === 0 || isSubmitting}
                title="Fonctionnalité à venir"
              >
                <Pause size={15} aria-hidden="true" />
                <span>En attente</span>
              </button>
            </div>

            {/* Process Pay CTA */}
            <button
              type="button"
              className="pos-v2__pay-btn"
              onClick={() => void handleSubmitSale()}
              disabled={isSubmitting || cartItems.length === 0}
            >
              <span>{isSubmitting ? 'Validation…' : 'Valider le paiement'}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </aside>
        </section>
      </main>

      {/* Receipt modal */}
      {receipt ? (
        <div
          className="app-modal-backdrop"
          role="none"
          onClick={() => setReceipt(null)}
        >
          <section
            className="app-modal pos-receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-modal__header">
              <div>
                <span className="eyebrow">Reçu</span>
                <h2 id="receipt-modal-title">Vente confirmée</h2>
                <p>{receipt.receiptNumber}</p>
              </div>
              <button
                type="button"
                className="app-btn app-btn--secondary"
                onClick={() => setReceipt(null)}
              >
                Fermer
              </button>
            </div>

            <div className="pos-receipt-meta">
              <article>
                <span>Encaissée le</span>
                <strong>{formatDateTime(receipt.soldAt)}</strong>
              </article>
              <article>
                <span>Caissier</span>
                <strong>{receipt.cashier.name}</strong>
              </article>
              <article>
                <span>Paiement</span>
                <strong>{getPaymentModeLabel(receipt.paymentMode)}</strong>
              </article>
            </div>

            <div className="pos-receipt-lines">
              {receipt.items.map((item) => (
                <div key={item.id} className="pos-receipt-line">
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{item.qty} × {formatMoney(item.unitPrice)}</span>
                  </div>
                  <strong>{formatMoney(item.qty * item.unitPrice - (item.discount ?? 0))}</strong>
                </div>
              ))}
            </div>

            <div className="pos-receipt-total">
              <span>Total</span>
              <strong>{formatMoney(receipt.totalAmount)}</strong>
            </div>

            <div className="app-modal__footer">
              <p>Le stock a été mis à jour et la caisse est prête pour une nouvelle vente.</p>
              <button
                type="button"
                className="app-btn app-btn--primary"
                onClick={() => setReceipt(null)}
              >
                Nouvelle vente
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
