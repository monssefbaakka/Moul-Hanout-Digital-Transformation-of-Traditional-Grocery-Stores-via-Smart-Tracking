'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  PackageSearch,
  ReceiptText,
  Search,
  ShoppingBasket,
  Trash2,
} from 'lucide-react';
import type { PaymentMode, Product, SaleDetail } from '@moul-hanout/shared-types';
import { ApiError, productsApi, salesApi } from '@/lib/api/api-client';
import { AppPageHeader } from '@/components/layout/app-page-header';
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

function getPaymentModeLabel(paymentMode: PaymentMode) {
  switch (paymentMode) {
    case 'CASH':
      return 'Especes';
    case 'CARD':
      return 'Carte';
    case 'OTHER':
      return 'Autre';
    default:
      return paymentMode;
  }
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return initials.toUpperCase() || 'MH';
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

export function PosWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [receipt, setReceipt] = useState<SaleDetail | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    let isMounted = true;

    async function loadProducts() {
      try {
        const productList = await productsApi.list();

        if (!isMounted) {
          return;
        }

        setProducts(productList.sort((left, right) => left.name.localeCompare(right.name)));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger le catalogue.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isAuthenticated, router]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = deferredSearchTerm.trim().toLowerCase();

    return products.filter((product) => {
      if (!normalizedQuery) {
        return true;
      }

      return [product.name, product.barcode, product.category?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery));
    });
  }, [deferredSearchTerm, products]);

  const totalAmount = useMemo(
    () => cartItems.reduce((total, item) => total + item.lineTotal, 0),
    [cartItems],
  );

  const totalQuantity = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems],
  );

  function syncProductStock(updatedProducts: Product[]) {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          const product = updatedProducts.find((entry) => entry.id === item.productId);

          if (!product || product.currentStock <= 0) {
            return null;
          }

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
    const productList = await productsApi.list();
    const sortedProducts = productList.sort((left, right) => left.name.localeCompare(right.name));

    setProducts(sortedProducts);
    syncProductStock(sortedProducts);
  }

  function addToCart(product: Product) {
    if (product.currentStock <= 0) {
      setErrorMessage(`Le produit ${product.name} est en rupture de stock.`);
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product.id);

      if (!existingItem) {
        return [...currentItems, toCartItem(product)];
      }

      if (existingItem.quantity >= product.currentStock) {
        setErrorMessage(`Stock disponible atteint pour ${product.name}.`);
        return currentItems;
      }

      return currentItems.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              availableStock: product.currentStock,
              lineTotal: (item.quantity + 1) * item.unitPrice,
            }
          : item,
      );
    });
  }

  function updateQuantity(productId: string, nextQuantity: number) {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    if (nextQuantity <= 0) {
      setCartItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
      return;
    }

    if (nextQuantity > product.currentStock) {
      setErrorMessage(`Seulement ${product.currentStock} unite(s) disponibles pour ${product.name}.`);
      return;
    }

    setErrorMessage(null);

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: nextQuantity,
              availableStock: product.currentStock,
              unitPrice: product.salePrice,
              lineTotal: nextQuantity * product.salePrice,
            }
          : item,
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
      const createdSale = await salesApi.create({
        paymentMode,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      await refreshProducts();
      setReceipt(createdSale);
      setCartItems([]);
      setPaymentMode('CASH');
      setSearchTerm('');
      setStatusMessage(`La vente ${createdSale.receiptNumber} a bien ete enregistree.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Impossible de valider la vente pour le moment.');
      }
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

  const availableProducts = products.filter((product) => product.currentStock > 0).length;
  const userInitials = getInitials(user?.name ?? 'Moul Hanout');

  return (
    <>
      <main className="page stack app-page pos-page">
        <AppPageHeader
          title="Point de vente"
          subtitle="Cherchez rapidement un produit, constituez le panier a droite et confirmez la vente sans quitter l'espace de caisse."
          actions={
            <div className="pos-header-actions">
              <div className="pos-header-chip">
                <span>Disponibles</span>
                <strong>{isLoading ? '...' : availableProducts}</strong>
              </div>
              <div className="pos-header-chip">
                <span>Panier</span>
                <strong>{totalQuantity}</strong>
              </div>
              <span className="app-sidebar__avatar">{userInitials}</span>
            </div>
          }
        />

        {statusMessage ? <p className="status-success" role="status">{statusMessage}</p> : null}
        {errorMessage ? <p className="status-error" role="alert">{errorMessage}</p> : null}

        <section className="pos-layout">
          <div className="pos-catalog">
            <article className="panel pos-panel">
              <div className="pos-panel__header">
                <div>
                  <span className="eyebrow">Catalogue</span>
                  <h2>Recherche produit</h2>
                  <p>Ajoutez un article au panier en un clic depuis le rayon actif.</p>
                </div>
              </div>

              <label className="pos-search" htmlFor="pos-search">
                <Search size={18} />
                <input
                  id="pos-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nom, code-barres ou categorie"
                  autoComplete="off"
                />
              </label>

              {isLoading ? <p>Chargement des produits...</p> : null}

              {!isLoading && products.length === 0 ? (
                <div className="pos-empty-state">
                  <PackageSearch size={20} />
                  <div>
                    <strong>Aucun produit actif</strong>
                    <p>Ajoutez d&apos;abord des produits pour ouvrir la caisse.</p>
                  </div>
                  <Link href="/produits" className="button-link">
                    Gerer les produits
                  </Link>
                </div>
              ) : null}

              {!isLoading && products.length > 0 && filteredProducts.length === 0 ? (
                <div className="pos-empty-state">
                  <PackageSearch size={20} />
                  <div>
                    <strong>Aucun resultat</strong>
                    <p>Essayez un autre nom, un code-barres ou une categorie.</p>
                  </div>
                </div>
              ) : null}

              {!isLoading && filteredProducts.length > 0 ? (
                <div className="pos-product-grid">
                  {filteredProducts.map((product) => {
                    const cartItem = cartItems.find((item) => item.productId === product.id);
                    const remainingStock = product.currentStock - (cartItem?.quantity ?? 0);
                    const outOfStock = product.currentStock <= 0;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={`pos-product-card${outOfStock ? ' is-disabled' : ''}`}
                        onClick={() => addToCart(product)}
                        disabled={outOfStock || isSubmitting}
                      >
                        <div className="pos-product-card__top">
                          <div>
                            <h3>{product.name}</h3>
                            <p>{product.category?.name ?? 'Categorie non renseignee'}</p>
                          </div>
                          <span className={`pos-stock-pill${outOfStock ? ' is-danger' : ''}`}>
                            {outOfStock
                              ? 'Rupture'
                              : `${remainingStock >= 0 ? remainingStock : 0} restant(s)`}
                          </span>
                        </div>

                        <div className="pos-product-card__meta">
                          <span>{product.barcode || product.unit || 'Reference simple'}</span>
                          <strong>{formatMoney(product.salePrice)}</strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </article>
          </div>

          <aside className="pos-sidebar">
            <article className="pos-cart-glass">
              <div className="pos-cart__header">
                <div>
                  <span className="eyebrow">Panier courant</span>
                  <h2>Encaissement</h2>
                </div>
                <span className="pos-cart__icon">
                  <ShoppingBasket size={18} />
                </span>
              </div>

              <div className="pos-payment-modes" role="radiogroup" aria-label="Mode de paiement">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`pos-payment-pill${paymentMode === mode ? ' is-active' : ''}`}
                    onClick={() => setPaymentMode(mode)}
                    disabled={isSubmitting}
                    aria-pressed={paymentMode === mode}
                  >
                    <CreditCard size={16} />
                    <span>{getPaymentModeLabel(mode)}</span>
                  </button>
                ))}
              </div>

              <div className="pos-cart-list">
                {cartItems.length === 0 ? (
                  <div className="pos-cart-empty">
                    <ReceiptText size={20} />
                    <p>Le panier est vide. Selectionnez un produit a gauche pour commencer.</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <article key={item.productId} className="pos-cart-item">
                      <div className="pos-cart-item__copy">
                        <div>
                          <h3>{item.name}</h3>
                          <p>{item.barcode || item.unit || 'Article standard'}</p>
                        </div>
                        <button
                          type="button"
                          className="pos-cart-item__remove"
                          onClick={() => updateQuantity(item.productId, 0)}
                          aria-label={`Retirer ${item.name}`}
                          disabled={isSubmitting}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="pos-cart-item__controls">
                        <div className="pos-qty-control">
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

                        <div className="pos-cart-item__amounts">
                          <span>{formatMoney(item.unitPrice)} / unite</span>
                          <strong>{formatMoney(item.lineTotal)}</strong>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="pos-cart-summary">
                <dl>
                  <div>
                    <dt>Articles</dt>
                    <dd>{totalQuantity}</dd>
                  </div>
                  <div>
                    <dt>Mode</dt>
                    <dd>{getPaymentModeLabel(paymentMode)}</dd>
                  </div>
                </dl>

                <div className="pos-cart-summary__total">
                  <span>Total a payer</span>
                  <strong>{formatMoney(totalAmount)}</strong>
                </div>

                <button
                  type="button"
                  className="app-btn app-btn--primary pos-submit-button"
                  onClick={() => void handleSubmitSale()}
                  disabled={isSubmitting || cartItems.length === 0}
                >
                  {isSubmitting ? 'Validation en cours...' : 'Valider la vente'}
                </button>
              </div>
            </article>
          </aside>
        </section>
      </main>

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
            onClick={(event) => event.stopPropagation()}
          >
            <div className="app-modal__header">
              <div>
                <span className="eyebrow">Recu</span>
                <h2 id="receipt-modal-title">Vente confirmee</h2>
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
                <span>Encaissee le</span>
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
                    <span>
                      {item.qty} x {formatMoney(item.unitPrice)}
                    </span>
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
              <p>Le stock a ete mis a jour et la caisse est prete pour une nouvelle vente.</p>
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
