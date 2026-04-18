'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CircleDollarSign,
  ImageIcon,
  ImagePlus,
  Info,
  Package2,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import type { Category, CreateProductInput, Product } from '@moul-hanout/shared-types';
import { ApiError, categoriesApi, inventoryApi, productsApi } from '@/lib/api/api-client';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { useAuthStore } from '@/store/auth.store';

type ProductFormState = {
  name: string;
  categoryId: string;
  salePrice: string;
  costPrice: string;
  barcode: string;
  description: string;
  unit: string;
  photo: string;
  lowStockThreshold: string;
  expirationDate: string;
  initialStock: string;
};

type SubmitIntent = 'publish' | 'draft';

const DEFAULT_LOW_STOCK_THRESHOLD = '5';
const DEFAULT_INITIAL_STOCK = '0';
const INITIAL_STOCK_REASON = 'Initial stock during product creation';

function createInitialForm(categoryId = ''): ProductFormState {
  return {
    name: '',
    categoryId,
    salePrice: '',
    costPrice: '',
    barcode: '',
    description: '',
    unit: '',
    photo: '',
    lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    expirationDate: '',
    initialStock: DEFAULT_INITIAL_STOCK,
  };
}

function toIsoDate(dateValue: string) {
  if (!dateValue) {
    return undefined;
  }

  return new Date(`${dateValue}T00:00:00.000Z`).toISOString();
}

function buildPayload(form: ProductFormState, intent: SubmitIntent): CreateProductInput {
  const expirationDate = toIsoDate(form.expirationDate);

  return {
    name: form.name.trim(),
    categoryId: form.categoryId,
    salePrice: Number(form.salePrice),
    isActive: intent === 'publish',
    ...(form.costPrice ? { costPrice: Number(form.costPrice) } : {}),
    ...(form.barcode ? { barcode: form.barcode.trim() } : {}),
    ...(form.description ? { description: form.description.trim() } : {}),
    ...(form.unit ? { unit: form.unit.trim() } : {}),
    ...(form.photo ? { photo: form.photo.trim() } : {}),
    ...(form.lowStockThreshold ? { lowStockThreshold: Number(form.lowStockThreshold) } : {}),
    ...(expirationDate ? { expirationDate } : {}),
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not tracked';
  }

  return new Date(value).toLocaleDateString();
}

function getDraftState(form: ProductFormState, defaultCategoryId: string) {
  return (
    form.name.trim().length > 0 ||
    form.categoryId !== defaultCategoryId ||
    form.salePrice.trim().length > 0 ||
    form.costPrice.trim().length > 0 ||
    form.barcode.trim().length > 0 ||
    form.description.trim().length > 0 ||
    form.unit.trim().length > 0 ||
    form.photo.trim().length > 0 ||
    form.lowStockThreshold !== DEFAULT_LOW_STOCK_THRESHOLD ||
    form.expirationDate.trim().length > 0 ||
    form.initialStock !== DEFAULT_INITIAL_STOCK
  );
}

function getProductStatusLabel(product: Product) {
  if (!product.isActive) {
    return 'Draft';
  }

  if (product.currentStock <= product.lowStockThreshold) {
    return 'Low stock';
  }

  return 'Active';
}

function getProductStatusVariant(product: Product) {
  if (!product.isActive) {
    return 'is-draft';
  }

  if (product.currentStock <= product.lowStockThreshold) {
    return 'is-alert';
  }

  return 'is-active';
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return initials.toUpperCase() || 'VM';
}

export function ProductsWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormState>(createInitialForm());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated || user?.role !== 'OWNER') {
      router.replace('/');
      return;
    }

    let isMounted = true;

    async function loadWorkspace() {
      try {
        const [categoryList, productList] = await Promise.all([
          categoriesApi.list(),
          productsApi.listAll(),
        ]);

        if (!isMounted) {
          return;
        }

        const fallbackCategoryId = categoryList[0]?.id ?? '';

        setCategories(categoryList);
        setProducts(productList);
        setForm((current) => {
          const categoryStillExists = categoryList.some((category) => category.id === current.categoryId);

          return {
            ...current,
            categoryId: categoryStillExists ? current.categoryId : fallbackCategoryId,
          };
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load the product workspace.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isAuthenticated, router, user?.role]);

  function handleDiscard() {
    const defaultCategoryId = categories[0]?.id ?? '';

    setForm(createInitialForm(defaultCategoryId));
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function refreshProducts(categoryIdFallback: string) {
    const productList = await productsApi.listAll();
    setProducts(productList);
    setForm(createInitialForm(categoryIdFallback));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nativeEvent = event.nativeEvent as SubmitEvent;
    const submitter = nativeEvent.submitter as HTMLButtonElement | null;
    const intent: SubmitIntent = submitter?.value === 'draft' ? 'draft' : 'publish';
    const salePriceValue = Number(form.salePrice);
    const costPriceValue = form.costPrice ? Number(form.costPrice) : undefined;
    const initialStockValue = Number(form.initialStock);
    const hasInitialStock = !Number.isNaN(initialStockValue) && initialStockValue > 0;

    if (categories.length === 0) {
      setErrorMessage('Create at least one category before adding products.');
      return;
    }

    if (Number.isNaN(salePriceValue) || salePriceValue < 0) {
      setErrorMessage('Sale price must be greater than or equal to 0.');
      return;
    }

    if (costPriceValue !== undefined && (Number.isNaN(costPriceValue) || costPriceValue < 0)) {
      setErrorMessage('Cost price must be greater than or equal to 0.');
      return;
    }

    if (costPriceValue !== undefined && costPriceValue > salePriceValue) {
      setErrorMessage('Cost price cannot be greater than sale price.');
      return;
    }

    if (intent === 'draft' && hasInitialStock) {
      setErrorMessage('Initial stock can only be applied when creating an active product.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const createdProduct = await productsApi.create(buildPayload(form, intent));

      if (intent === 'publish' && hasInitialStock) {
        const expirationDate = toIsoDate(form.expirationDate);

        await inventoryApi.stockIn({
          productId: createdProduct.id,
          quantity: initialStockValue,
          reason: INITIAL_STOCK_REASON,
          ...(expirationDate ? { expirationDate } : {}),
        });
      }

      const categoryIdFallback = categories.some((category) => category.id === form.categoryId)
        ? form.categoryId
        : categories[0]?.id ?? '';

      await refreshProducts(categoryIdFallback);
      setStatusMessage(
        intent === 'draft'
          ? `Draft ${createdProduct.name} saved successfully.`
          : hasInitialStock
            ? `Product ${createdProduct.name} created and stocked successfully.`
            : `Product ${createdProduct.name} created successfully.`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to create the product right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="page">
        <section className="panel">
          <p>Loading workspace...</p>
        </section>
      </main>
    );
  }

  if (user?.role !== 'OWNER') {
    return (
      <main className="page">
        <section className="panel">
          <p>Redirecting...</p>
        </section>
      </main>
    );
  }

  const selectedCategory = categories.find((category) => category.id === form.categoryId) ?? null;
  const salePriceValue = form.salePrice ? Number(form.salePrice) : NaN;
  const costPriceValue = form.costPrice ? Number(form.costPrice) : NaN;
  const lowStockThresholdValue = Number(form.lowStockThreshold);
  const initialStockValue = Number(form.initialStock);
  const hasInitialStock = !Number.isNaN(initialStockValue) && initialStockValue > 0;
  const pricingRuleViolated =
    form.costPrice.trim().length > 0 &&
    !Number.isNaN(costPriceValue) &&
    !Number.isNaN(salePriceValue) &&
    costPriceValue > salePriceValue;
  const invalidNonNegativeField =
    (!Number.isNaN(lowStockThresholdValue) && lowStockThresholdValue < 0) ||
    (!Number.isNaN(initialStockValue) && initialStockValue < 0) ||
    (!Number.isNaN(salePriceValue) && salePriceValue < 0) ||
    (form.costPrice.trim().length > 0 && !Number.isNaN(costPriceValue) && costPriceValue < 0);
  const canSubmit =
    !isSubmitting &&
    !isLoading &&
    categories.length > 0 &&
    form.name.trim().length > 0 &&
    form.categoryId.trim().length > 0 &&
    form.salePrice.trim().length > 0 &&
    !Number.isNaN(salePriceValue) &&
    !pricingRuleViolated &&
    !invalidNonNegativeField;
  const canSaveDraft = canSubmit && !hasInitialStock;
  const draftChanged = getDraftState(form, categories[0]?.id ?? '');
  const activeProducts = products.filter((product) => product.isActive).length;
  const draftProducts = products.filter((product) => !product.isActive).length;
  const lowStockProducts = products.filter(
    (product) => product.isActive && product.currentStock <= product.lowStockThreshold,
  ).length;
  const marginLabel =
    !Number.isNaN(salePriceValue) &&
    !Number.isNaN(costPriceValue) &&
    salePriceValue > 0 &&
    form.costPrice.trim().length > 0
      ? `${Math.round(((salePriceValue - costPriceValue) / salePriceValue) * 100)}%`
      : '-- %';
  const previewDescription =
    form.description.trim() || 'Add a short description to make the product easier to identify.';
  const validationMessage = pricingRuleViolated
    ? 'Cost price cannot be greater than sale price.'
    : invalidNonNegativeField
      ? 'Prices, stock, and alert thresholds must stay greater than or equal to 0.'
      : null;
  const photoPreview = form.photo.trim();
  const userInitials = getInitials(user.name);

  return (
    <main className="page stack app-page">
      <AppPageHeader
        title="Ajouter un produit"
        subtitle="Remplissez les informations du produit, verifiez le prix et preparez le stock initial dans une vue claire et simple."
        actions={
          <>
            <span className="products-studio-avatar">{userInitials}</span>
            <button
              type="submit"
              form="product-create-form"
              value="publish"
              className="products-studio-primary-button products-studio-primary-button--compact"
              disabled={!canSubmit}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      />

      {statusMessage ? <p className="status-success">{statusMessage}</p> : null}
      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}

      {!isLoading && categories.length === 0 ? (
        <section className="products-studio-empty-state">
          <h2>Creer une categorie d&apos;abord</h2>
          <p>
            Les produits ont besoin d&apos;une categorie valide avant de pouvoir etre enregistres.
          </p>
          <Link href="/categories" className="products-studio-secondary-button">
            Ouvrir les categories
          </Link>
        </section>
      ) : null}

      <form id="product-create-form" onSubmit={handleSubmit}>
        <section className="products-studio-grid">
          <div className="products-studio-main-column">
            <article className="products-studio-card">
              <div className="products-studio-section-title">
                <span className="products-studio-section-icon is-primary">
                  <Info size={18} />
                </span>
                <div>
                  <h2>Informations generales</h2>
                  <p>Donnez un nom clair au produit et choisissez la bonne categorie.</p>
                </div>
              </div>

              <div className="products-studio-form-grid">
                  <label className="products-studio-field">
                    <span>Nom du produit</span>
                    <input
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder="e.g. Organic Heritage Carrots"
                      required
                      maxLength={120}
                      disabled={isSubmitting || isLoading}
                    />
                  </label>

                  <label className="products-studio-field">
                    <span>Categorie</span>
                    <select
                      value={form.categoryId}
                      onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                      required
                      disabled={isSubmitting || isLoading || categories.length === 0}
                    >
                      {categories.length === 0 ? <option value="">No categories available</option> : null}
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="products-studio-field products-studio-field--wide">
                    <span>Description</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                      placeholder="Describe the origin, flavor profile, or unique selling points..."
                      rows={5}
                      maxLength={300}
                      disabled={isSubmitting || isLoading}
                    />
                  </label>
              </div>
            </article>

            <article className="products-studio-card">
              <div className="products-studio-section-title">
                <span className="products-studio-section-icon is-secondary">
                  <Package2 size={18} />
                </span>
                <div>
                  <h2>Stock et reference</h2>
                  <p>Ajoutez les informations utiles pour suivre le produit en magasin.</p>
                </div>
              </div>

              <div className="products-studio-form-grid products-studio-form-grid--three">
                  <label className="products-studio-field">
                    <span>SKU / code-barres</span>
                    <div className="products-studio-input-icon-wrap">
                      <input
                        value={form.barcode}
                        onChange={(event) => setForm({ ...form, barcode: event.target.value })}
                        placeholder="SKU-8271"
                        maxLength={64}
                        disabled={isSubmitting || isLoading}
                      />
                      <ScanLine size={18} />
                    </div>
                  </label>

                  <label className="products-studio-field">
                    <span>Unite</span>
                    <input
                      value={form.unit}
                      onChange={(event) => setForm({ ...form, unit: event.target.value })}
                      placeholder="piece, kg, bottle"
                      maxLength={30}
                      disabled={isSubmitting || isLoading}
                    />
                  </label>

                  <label className="products-studio-field">
                    <span>Alerte stock bas</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.lowStockThreshold}
                      onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })}
                      placeholder={DEFAULT_LOW_STOCK_THRESHOLD}
                      disabled={isSubmitting || isLoading}
                    />
                  </label>

                  <label className="products-studio-field">
                    <span>Stock initial</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.initialStock}
                      onChange={(event) => setForm({ ...form, initialStock: event.target.value })}
                      placeholder="0"
                      disabled={isSubmitting || isLoading}
                    />
                  </label>

                  <label className="products-studio-field">
                    <span>Date d&apos;expiration</span>
                    <input
                      type="date"
                      value={form.expirationDate}
                      onChange={(event) => setForm({ ...form, expirationDate: event.target.value })}
                      disabled={isSubmitting || isLoading}
                    />
                  </label>

                  <div className="products-studio-note-card">
                    <strong>{hasInitialStock ? 'Publication requise' : 'Brouillon possible'}</strong>
                    <p>
                      {hasInitialStock
                        ? "Le stock initial est ajoute seulement si le produit est cree comme actif."
                        : "Laissez le stock initial a 0 si vous souhaitez enregistrer un brouillon."}
                    </p>
                  </div>
              </div>
            </article>
          </div>

          <div className="products-studio-side-column">
            <article className="products-studio-card products-studio-card--pricing">
              <div className="products-studio-pricing-head">
                <div>
                  <h2>Tarification</h2>
                  <p>Verifiez rapidement les prix avant la publication.</p>
                </div>

                <span className="products-studio-section-icon is-primary">
                  <CircleDollarSign size={18} />
                </span>
              </div>

              <div className="products-studio-pricing-body">
                  <label className="products-studio-field">
                    <span>Prix d&apos;achat</span>
                    <div className="products-studio-currency-input">
                      <i>$</i>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.costPrice}
                        onChange={(event) => setForm({ ...form, costPrice: event.target.value })}
                        placeholder="0.00"
                        disabled={isSubmitting || isLoading}
                      />
                    </div>
                  </label>

                  <label className="products-studio-field">
                    <span>Prix de vente</span>
                    <div className="products-studio-currency-input">
                      <i>$</i>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.salePrice}
                        onChange={(event) => setForm({ ...form, salePrice: event.target.value })}
                        placeholder="0.00"
                        required
                        disabled={isSubmitting || isLoading}
                      />
                    </div>
                  </label>

                  <div className="products-studio-note-card">
                    <strong>{selectedCategory?.name ?? 'Aucune categorie selectionnee'}</strong>
                    <p>{previewDescription}</p>
                  </div>

                  <div className="products-studio-margin-row">
                    <span>Marge attendue</span>
                    <strong>{marginLabel}</strong>
                  </div>
              </div>
            </article>

            <article className="products-studio-card">
              <h2 className="products-studio-media-title">Image produit</h2>

              <div className="products-studio-media-preview">
                  {photoPreview ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt={form.name.trim() || 'Product preview'}
                        className="products-studio-media-preview__image"
                      />
                      <div className="products-studio-media-preview__overlay" />

                      <div className="products-studio-media-preview__content">
                        <p>{form.name.trim() || 'Product preview'}</p>
                        <span>Apercu direct depuis l&apos;URL de l&apos;image.</span>
                      </div>
                    </>
                  ) : (
                    <div className="products-studio-media-preview__content">
                      <span className="products-studio-media-icon">
                        <ImagePlus size={20} />
                      </span>
                      <p>Ajoutez une URL d&apos;image</p>
                      <span>Une image claire aide a reconnaitre le produit plus vite.</span>
                    </div>
                  )}
              </div>

              <label className="products-studio-field">
                <span>URL image principale</span>
                <input
                  value={form.photo}
                  onChange={(event) => setForm({ ...form, photo: event.target.value })}
                  placeholder="https://example.com/product.jpg"
                  maxLength={500}
                  disabled={isSubmitting || isLoading}
                />
              </label>

              <div className="products-studio-thumbnail-grid" aria-hidden="true">
                <div className={photoPreview ? 'is-highlighted' : ''}>
                  <ImageIcon size={18} />
                </div>
                <div>
                  <ImageIcon size={18} />
                </div>
                <div>
                  <ImageIcon size={18} />
                </div>
                <div className="is-highlighted">
                  <ImagePlus size={18} />
                </div>
              </div>
            </article>

            <aside className="products-studio-tip">
              <span className="products-studio-tip__icon">
                <Sparkles size={18} />
              </span>
              <div>
                <h3>Conseil utile</h3>
                <p>
                  Une description courte et une image propre rendent le produit plus facile a
                  reconnaitre pour votre equipe.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </form>

      {validationMessage ? <p className="status-error">{validationMessage}</p> : null}

      <div className="products-studio-footer-bar">
        <div className="products-studio-footer-copy">
          <AlertCircle size={18} />
          <span>
            {draftChanged
              ? 'Les changements non enregistres seront perdus si vous quittez cette page.'
              : 'Le formulaire est pret pour un nouveau produit.'}
          </span>
        </div>

        <div className="products-studio-footer-actions">
          <button
            type="button"
            className="products-studio-ghost-button"
            onClick={handleDiscard}
            disabled={isSubmitting || isLoading}
          >
            Annuler
          </button>

          <button
            type="submit"
            form="product-create-form"
            value="draft"
            className="products-studio-secondary-button"
            disabled={!canSaveDraft}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer brouillon'}
          </button>

          <button
            type="submit"
            form="product-create-form"
            value="publish"
            className="products-studio-primary-button"
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Creation...' : 'Creer le produit'}
          </button>
        </div>
      </div>

      <section className="products-studio-catalog">
        <div className="products-studio-catalog__header">
          <div>
            <h2>Catalogue actuel</h2>
            <p>Relisez les produits actifs, les brouillons et les produits a surveiller.</p>
          </div>

          <div className="products-studio-header__stats">
            <article>
              <strong>{isLoading ? '...' : categories.length}</strong>
              <span>Categories</span>
            </article>
            <article>
              <strong>{isLoading ? '...' : activeProducts}</strong>
              <span>Produits actifs</span>
            </article>
            <article>
              <strong>{isLoading ? '...' : draftProducts + lowStockProducts}</strong>
              <span>A surveiller</span>
            </article>
          </div>
        </div>

        {isLoading ? <p>Loading products...</p> : null}
        {!isLoading && products.length === 0 ? (
          <p>No products yet. Create the first item to start building the catalog.</p>
        ) : null}

        {!isLoading && products.length > 0 ? (
          <div className="products-studio-catalog-grid">
            {products.map((product) => (
              <article key={product.id} className="products-studio-catalog-card">
                <div className="products-studio-catalog-card__top">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.category?.name ?? 'No category assigned'}</p>
                  </div>

                  <span
                    className={`products-studio-status-pill ${getProductStatusVariant(product)}`}
                  >
                    {getProductStatusLabel(product)}
                  </span>
                </div>

                <dl className="products-studio-catalog-metrics">
                  <div>
                    <dt>Prix vente</dt>
                    <dd>${formatMoney(product.salePrice)}</dd>
                  </div>
                  <div>
                    <dt>Prix achat</dt>
                    <dd>
                      {product.costPrice != null ? `$${formatMoney(product.costPrice)}` : '--'}
                    </dd>
                  </div>
                  <div>
                    <dt>Stock</dt>
                    <dd className={product.currentStock <= product.lowStockThreshold ? 'is-alert' : ''}>
                      {product.currentStock}
                    </dd>
                  </div>
                  <div>
                    <dt>Expiration</dt>
                    <dd>{formatDate(product.expirationDate)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
