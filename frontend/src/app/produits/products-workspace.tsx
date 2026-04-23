'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Info,
  Lightbulb,
  Minus,
  Package2,
  Pencil,
  Plus,
  ScanLine,
  ShoppingCart,
  UploadCloud,
} from 'lucide-react';
import type { Category, CreateProductInput, Product } from '@moul-hanout/shared-types';
import { ApiError, categoriesApi, inventoryApi, productsApi } from '@/lib/api/api-client';
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

type ProductUpdatePayload = {
  name: string;
  categoryId: string;
  salePrice: number;
  isActive: boolean;
  costPrice?: number | null;
  barcode?: string | null;
  description?: string | null;
  unit?: string | null;
  photo?: string | null;
  lowStockThreshold?: number;
  expirationDate?: string | null;
};

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

function createFormFromProduct(product: Product): ProductFormState {
  return {
    name: product.name,
    categoryId: product.categoryId,
    salePrice: String(product.salePrice),
    costPrice: product.costPrice != null ? String(product.costPrice) : '',
    barcode: product.barcode ?? '',
    description: product.description ?? '',
    unit: product.unit ?? '',
    photo: product.photo ?? '',
    lowStockThreshold: String(product.lowStockThreshold),
    expirationDate: product.expirationDate ? product.expirationDate.slice(0, 10) : '',
    initialStock: DEFAULT_INITIAL_STOCK,
  };
}

function areFormsEqual(left: ProductFormState, right: ProductFormState) {
  return (
    left.name === right.name &&
    left.categoryId === right.categoryId &&
    left.salePrice === right.salePrice &&
    left.costPrice === right.costPrice &&
    left.barcode === right.barcode &&
    left.description === right.description &&
    left.unit === right.unit &&
    left.photo === right.photo &&
    left.lowStockThreshold === right.lowStockThreshold &&
    left.expirationDate === right.expirationDate &&
    left.initialStock === right.initialStock
  );
}

function toIsoDate(dateValue: string) {
  if (!dateValue) return undefined;
  return new Date(`${dateValue}T00:00:00.000Z`).toISOString();
}

function buildCreatePayload(form: ProductFormState, intent: SubmitIntent): CreateProductInput {
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

function buildUpdatePayload(form: ProductFormState, intent: SubmitIntent): ProductUpdatePayload {
  const expirationDate = toIsoDate(form.expirationDate);

  return {
    name: form.name.trim(),
    categoryId: form.categoryId,
    salePrice: Number(form.salePrice),
    isActive: intent === 'publish',
    costPrice: form.costPrice.trim().length > 0 ? Number(form.costPrice) : null,
    barcode: form.barcode.trim().length > 0 ? form.barcode.trim() : null,
    description: form.description.trim().length > 0 ? form.description.trim() : null,
    unit: form.unit.trim().length > 0 ? form.unit.trim() : null,
    photo: form.photo.trim().length > 0 ? form.photo.trim() : null,
    lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : undefined,
    expirationDate: expirationDate ?? null,
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return 'Non suivie';
  return new Date(value).toLocaleDateString('fr-MA');
}

function getProductStatusLabel(product: Product) {
  if (!product.isActive) return 'Brouillon';
  if (product.currentStock <= product.lowStockThreshold) return 'Stock bas';
  return 'Actif';
}

function getProductStatusVariant(product: Product) {
  if (!product.isActive) return 'is-draft';
  if (product.currentStock <= product.lowStockThreshold) return 'is-alert';
  return 'is-active';
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

export function ProductsWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(createInitialForm());
  const [baselineForm, setBaselineForm] = useState<ProductFormState>(createInitialForm());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;

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

        if (!isMounted) return;

        const fallbackCategoryId = categoryList[0]?.id ?? '';
        const initialForm = createInitialForm(fallbackCategoryId);

        setCategories(categoryList);
        setProducts(productList);
        setEditingProductId(null);
        setForm(initialForm);
        setBaselineForm(initialForm);
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger l'espace produits.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isAuthenticated, router, user?.role]);

  function resetToCreateForm(categoryId: string) {
    const initialForm = createInitialForm(categoryId);
    setEditingProductId(null);
    setForm(initialForm);
    setBaselineForm(initialForm);
  }

  function handleDiscard() {
    resetToCreateForm(categories[0]?.id ?? '');
    setStatusMessage(null);
    setErrorMessage(null);
  }

  async function refreshProducts(categoryIdFallback: string) {
    const productList = await productsApi.listAll();
    setProducts(productList);
    resetToCreateForm(categoryIdFallback);
  }

  function handleStartEdit(product: Product) {
    const nextForm = createFormFromProduct(product);

    setEditingProductId(product.id);
    setForm(nextForm);
    setBaselineForm(nextForm);
    setStatusMessage(`Mode edition active pour "${product.name}".`);
    setErrorMessage(null);

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
    const isEditing = editingProductId !== null;

    if (categories.length === 0) {
      setErrorMessage("Creez au moins une categorie avant d'ajouter des produits.");
      return;
    }

    if (Number.isNaN(salePriceValue) || salePriceValue < 0) {
      setErrorMessage('Le prix de vente doit etre superieur ou egal a 0.');
      return;
    }

    if (costPriceValue !== undefined && (Number.isNaN(costPriceValue) || costPriceValue < 0)) {
      setErrorMessage("Le prix d'achat doit etre superieur ou egal a 0.");
      return;
    }

    if (costPriceValue !== undefined && costPriceValue > salePriceValue) {
      setErrorMessage("Le prix d'achat ne peut pas depasser le prix de vente.");
      return;
    }

    if (isEditing && hasInitialStock) {
      setErrorMessage("Le stock initial se gere depuis l'inventaire, pas depuis la modification produit.");
      return;
    }

    if (!isEditing && intent === 'draft' && hasInitialStock) {
      setErrorMessage("Le stock initial n'est possible que pour un produit cree comme actif.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      if (isEditing && editingProductId) {
        const updatedProduct = await productsApi.update(
          editingProductId,
          buildUpdatePayload(form, intent),
        );

        const categoryIdFallback = categories.some((category) => category.id === form.categoryId)
          ? form.categoryId
          : categories[0]?.id ?? '';

        await refreshProducts(categoryIdFallback);
        setStatusMessage(
          intent === 'draft'
            ? `Le brouillon "${updatedProduct.name}" a ete mis a jour.`
            : `"${updatedProduct.name}" a ete mis a jour avec succes.`,
        );
        return;
      }

      const createdProduct = await productsApi.create(buildCreatePayload(form, intent));

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
          ? `Le brouillon "${createdProduct.name}" a ete enregistre.`
          : hasInitialStock
            ? `"${createdProduct.name}" a ete cree avec son stock initial.`
            : `"${createdProduct.name}" a ete cree avec succes.`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          editingProductId
            ? 'Impossible de mettre a jour le produit pour le moment.'
            : 'Impossible de creer le produit pour le moment.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="page">
        <section className="panel">
          <p>Chargement...</p>
        </section>
      </main>
    );
  }

  if (user?.role !== 'OWNER') {
    return (
      <main className="page">
        <section className="panel">
          <p>Redirection...</p>
        </section>
      </main>
    );
  }

  const editingProduct = editingProductId
    ? products.find((product) => product.id === editingProductId) ?? null
    : null;
  const isEditing = editingProduct !== null;
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
  const draftChanged = !areFormsEqual(form, baselineForm);
  const activeProducts = products.filter((product) => product.isActive).length;
  const draftProducts = products.filter((product) => !product.isActive).length;
  const lowStockProducts = products.filter(
    (product) => product.isActive && product.currentStock <= product.lowStockThreshold,
  ).length;
  const hasMargin =
    !Number.isNaN(salePriceValue) &&
    !Number.isNaN(costPriceValue) &&
    salePriceValue > 0 &&
    form.costPrice.trim().length > 0;
  const marginLabel = hasMargin
    ? `${Math.round(((salePriceValue - costPriceValue) / salePriceValue) * 100)}%`
    : null;
  const validationMessage = pricingRuleViolated
    ? "Le prix d'achat ne peut pas depasser le prix de vente."
    : invalidNonNegativeField
      ? "Les prix, le stock et le seuil d'alerte doivent etre >= 0."
      : null;
  const photoPreview = form.photo.trim();
  const userInitials = getInitials(user.name);
  const canChangeInitialStock = !isEditing;
  const topbarTitle = isEditing ? 'Modifier un produit' : 'Nouveau produit';
  const topbarSubmitLabel = isSubmitting
    ? 'Enregistrement...'
    : isEditing
      ? 'Mettre a jour'
      : 'Publier';
  const footerDraftLabel = isSubmitting
    ? 'Enregistrement...'
    : isEditing
      ? 'Mettre a jour brouillon'
      : 'Enregistrer brouillon';
  const footerPublishLabel = isSubmitting
    ? isEditing
      ? 'Mise a jour...'
      : 'Creation...'
    : isEditing
      ? 'Mettre a jour le produit'
      : 'Publier le produit';

  return (
    <main className="ps-page">
      <header className="ps-topbar">
        <div className="ps-topbar__left">
          <Link href="/produits" className="ps-back-btn" aria-label="Retour">
            <ArrowLeft size={18} />
          </Link>
          <div className="ps-topbar__title-wrap">
            <h1 className="ps-topbar__title">{topbarTitle}</h1>
            <span className={`ps-mode-pill${isEditing ? ' is-editing' : ''}`}>
              {isEditing ? 'Edition' : 'Creation'}
            </span>
          </div>
        </div>
        <div className="ps-topbar__right">
          <span className="ps-avatar">{userInitials}</span>
          <button
            type="submit"
            form="product-create-form"
            value="publish"
            className="ps-btn-publish"
            disabled={!canSubmit}
          >
            {topbarSubmitLabel}
          </button>
        </div>
      </header>

      {statusMessage && <div className="ps-alert ps-alert--success">{statusMessage}</div>}
      {(errorMessage || validationMessage) && (
        <div className="ps-alert ps-alert--error">{errorMessage ?? validationMessage}</div>
      )}

      {!isLoading && categories.length === 0 && (
        <div className="ps-notice">
          <h2>Creez une categorie d&apos;abord</h2>
          <p>
            Les produits ont besoin d&apos;une categorie valide pour rester organises dans le catalogue.
          </p>
          <Link href="/categories" className="app-btn app-btn--secondary">
            Ouvrir les categories
          </Link>
        </div>
      )}

      <form id="product-create-form" onSubmit={handleSubmit} ref={formRef}>
        <div className="ps-workspace">
          <div className="ps-form-col">
            {isEditing && editingProduct ? (
              <div className="ps-mode-note">
                <div>
                  <strong>Edition en cours</strong>
                  <p>
                    Vous modifiez actuellement &quot;{editingProduct.name}&quot;. Les mouvements de stock
                    restent geres depuis le module inventaire.
                  </p>
                </div>
                <button
                  type="button"
                  className="app-btn app-btn--secondary app-btn--sm"
                  onClick={handleDiscard}
                  disabled={isSubmitting}
                >
                  Quitter l&apos;edition
                </button>
              </div>
            ) : null}

            <div
              className={`ps-media-zone${isDragging ? ' is-over' : ''}${photoPreview ? ' has-preview' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);

                const url =
                  event.dataTransfer.getData('text/uri-list') ||
                  event.dataTransfer.getData('text/plain');

                if (url.startsWith('http')) {
                  setForm((current) => ({ ...current, photo: url }));
                }
              }}
              onClick={() => urlInputRef.current?.focus()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  urlInputRef.current?.focus();
                }
              }}
              aria-label="Zone d'image produit"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Apercu produit" className="ps-media-zone__img" />
              ) : (
                <>
                  <div className="ps-media-zone__icon">
                    <UploadCloud size={26} />
                  </div>
                  <p className="ps-media-zone__title">Ajouter une image produit</p>
                  <p className="ps-media-zone__hint">Glissez une URL ici ou collez-la dans le champ ci-dessous.</p>
                </>
              )}
            </div>

            <input
              ref={urlInputRef}
              className="ps-url-input"
              value={form.photo}
              onChange={(event) => setForm({ ...form, photo: event.target.value })}
              placeholder="Coller l'URL de l'image"
              maxLength={500}
              disabled={isSubmitting || isLoading}
            />

            <article className="ps-card">
              <div className="ps-card-header">
                <div className="ps-badge ps-badge--blue">
                  <Info size={14} />
                </div>
                <h2>Informations produit</h2>
              </div>

              <div className="ps-fields">
                <label className="ps-field ps-field--full">
                  <span className="ps-label">NOM DU PRODUIT</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Ex : The vert a la menthe"
                    required
                    maxLength={120}
                    disabled={isSubmitting || isLoading}
                  />
                </label>

                <div className="ps-row">
                  <label className="ps-field">
                    <span className="ps-label">CATEGORIE</span>
                    <div className="ps-select-wrap">
                      <select
                        value={form.categoryId}
                        onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                        required
                        disabled={isSubmitting || isLoading || categories.length === 0}
                      >
                        {categories.length === 0 ? <option value="">Aucune categorie</option> : null}
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="ps-chevron" />
                    </div>
                  </label>

                  <label className="ps-field">
                    <span className="ps-label">UNITE</span>
                    <input
                      value={form.unit}
                      onChange={(event) => setForm({ ...form, unit: event.target.value })}
                      placeholder="kg, gramme, piece"
                      maxLength={30}
                      disabled={isSubmitting || isLoading}
                    />
                  </label>
                </div>

                <label className="ps-field ps-field--full">
                  <span className="ps-label">DESCRIPTION</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Precisez le produit pour l'equipe et le catalogue..."
                    rows={4}
                    maxLength={300}
                    disabled={isSubmitting || isLoading}
                  />
                </label>
              </div>
            </article>

            <article className="ps-card">
              <div className="ps-card-header">
                <div className="ps-badge ps-badge--green">
                  <CircleDollarSign size={14} />
                </div>
                <h2>Prix et marge</h2>
                {marginLabel ? (
                  <span className="ps-margin-pill">
                    <span className="ps-margin-dot" />
                    Marge estimee : {marginLabel}
                  </span>
                ) : null}
              </div>

              <div className="ps-row">
                <label className="ps-field">
                  <span className="ps-label">PRIX D&apos;ACHAT</span>
                  <div className="ps-currency-wrap">
                    <span className="ps-currency-symbol">MAD</span>
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

                <label className="ps-field">
                  <span className="ps-label">PRIX DE VENTE</span>
                  <div className="ps-currency-wrap">
                    <span className="ps-currency-symbol">MAD</span>
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
              </div>
            </article>

            <article className="ps-card">
              <div className="ps-card-header">
                <div className="ps-badge ps-badge--amber">
                  <Package2 size={14} />
                </div>
                <h2>Suivi stock</h2>
              </div>

              <div className="ps-fields">
                <div className="ps-row">
                  <label className="ps-field">
                    <span className="ps-label">CODE-BARRES / SKU</span>
                    <div className="ps-icon-wrap">
                      <input
                        value={form.barcode}
                        onChange={(event) => setForm({ ...form, barcode: event.target.value })}
                        placeholder="Scanner ou saisir le code"
                        maxLength={64}
                        disabled={isSubmitting || isLoading}
                      />
                      <ScanLine size={15} />
                    </div>
                  </label>

                  <label className="ps-field">
                    <span className="ps-label">STOCK INITIAL</span>
                    <div className="ps-stepper">
                      <button
                        type="button"
                        className="ps-stepper__btn"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            initialStock: String(Math.max(0, Number(current.initialStock) - 1)),
                          }))
                        }
                        disabled={
                          isSubmitting || !canChangeInitialStock || Number(form.initialStock) <= 0
                        }
                        aria-label="Diminuer"
                      >
                        <Minus size={13} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.initialStock}
                        onChange={(event) => setForm({ ...form, initialStock: event.target.value })}
                        disabled={isSubmitting || isLoading || !canChangeInitialStock}
                      />
                      <button
                        type="button"
                        className="ps-stepper__btn"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            initialStock: String(Number(current.initialStock) + 1),
                          }))
                        }
                        disabled={isSubmitting || !canChangeInitialStock}
                        aria-label="Augmenter"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    {!canChangeInitialStock ? (
                      <span className="ps-field-note">
                        Le stock se modifie ensuite depuis l&apos;inventaire pour respecter la separation des
                        responsabilites.
                      </span>
                    ) : null}
                  </label>
                </div>

                <div className="ps-row">
                  <label className="ps-field">
                    <span className="ps-label">SEUIL D&apos;ALERTE</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.lowStockThreshold}
                      onChange={(event) =>
                        setForm({ ...form, lowStockThreshold: event.target.value })
                      }
                      placeholder="5"
                      disabled={isSubmitting || isLoading}
                    />
                  </label>

                  <label className="ps-field">
                    <span className="ps-label">DATE D&apos;EXPIRATION</span>
                    <div className="ps-icon-wrap">
                      <input
                        type="date"
                        value={form.expirationDate}
                        onChange={(event) =>
                          setForm({ ...form, expirationDate: event.target.value })
                        }
                        disabled={isSubmitting || isLoading}
                      />
                      <CalendarDays size={15} />
                    </div>
                  </label>
                </div>
              </div>
            </article>
          </div>

          <div className="ps-preview-col">
            <p className="ps-preview-eyebrow">{isEditing ? 'Apercu de la fiche' : 'Resume produit'}</p>

            <div className="ps-preview-card">
              <div className="ps-preview-media">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt={form.name || 'Product'} />
                ) : (
                  <div className="ps-preview-media__empty" />
                )}

                {form.salePrice ? (
                  <span className="ps-preview-price-tag">
                    {formatMoney(Number(form.salePrice))}
                  </span>
                ) : null}
              </div>

              <div className="ps-preview-body">
                {selectedCategory ? (
                  <div className="ps-preview-meta">
                    <span className="ps-preview-category">
                      {selectedCategory.name.toUpperCase()}
                    </span>
                    <div className="ps-preview-dots">
                      <span className="is-active" />
                      <span />
                    </div>
                  </div>
                ) : null}

                <h3 className="ps-preview-name">{form.name || 'Nom produit'}</h3>

                <p className="ps-preview-desc">
                  {form.description || 'Ajoutez une description pour visualiser le resume produit.'}
                </p>

                <div className="ps-preview-footer">
                  {form.unit ? (
                    <div className="ps-preview-units">
                      <span className="is-sel">{form.unit}</span>
                    </div>
                  ) : (
                    <span />
                  )}

                  <button
                    type="button"
                    className="ps-preview-cart"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <ShoppingCart size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div className="ps-tip-card">
              <div className="ps-tip-icon">
                <Lightbulb size={15} />
              </div>
              <div>
                <h4 className="ps-tip-title">Conseil de saisie</h4>
                <p className="ps-tip-body">
                  Gardez des noms courts, une categorie claire et une photo lisible pour accelerer
                  la recherche produit en caisse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="ps-footer">
        <div className="ps-footer__info">
          <AlertCircle size={15} />
          <span>
            {draftChanged
              ? 'Les changements non enregistres seront perdus si vous quittez.'
              : isEditing
                ? 'Le formulaire est synchronise avec le produit en cours de modification.'
                : 'Formulaire pret pour un nouveau produit.'}
          </span>
        </div>

        <div className="ps-footer__actions">
          <button
            type="button"
            className="app-btn app-btn--ghost"
            onClick={handleDiscard}
            disabled={isSubmitting || isLoading}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="product-create-form"
            value="draft"
            className="app-btn app-btn--secondary"
            disabled={!canSaveDraft}
          >
            {footerDraftLabel}
          </button>
          <button
            type="submit"
            form="product-create-form"
            value="publish"
            className="app-btn app-btn--primary"
            disabled={!canSubmit}
          >
            {footerPublishLabel}
          </button>
        </div>
      </div>

      <section className="ps-catalog">
        <div className="ps-catalog__header">
          <div>
            <h2>Catalogue actuel</h2>
            <p>Produits actifs, brouillons et references a surveiller.</p>
          </div>
          <div className="ps-catalog__stats">
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

        {isLoading ? <p className="ps-catalog__empty">Chargement des produits...</p> : null}
        {!isLoading && products.length === 0 ? (
          <p className="ps-catalog__empty">
            Aucun produit pour le moment. Creez le premier article pour lancer le catalogue.
          </p>
        ) : null}

        {!isLoading && products.length > 0 ? (
          <div className="ps-catalog__grid">
            {products.map((product) => (
              <article
                key={product.id}
                className={`ps-catalog-card${editingProductId === product.id ? ' is-selected' : ''}`}
              >
                <div className="ps-catalog-card__top">
                  <button
                    type="button"
                    className="ps-catalog-card__select"
                    onClick={() => handleStartEdit(product)}
                  >
                    <span>
                      <h3>{product.name}</h3>
                      <p>{product.category?.name ?? 'Aucune categorie'}</p>
                    </span>
                  </button>
                  <div className="ps-catalog-card__actions">
                    <span className={`products-studio-status-pill ${getProductStatusVariant(product)}`}>
                      {getProductStatusLabel(product)}
                    </span>
                    <button
                      type="button"
                      className="ps-catalog-card__edit-btn"
                      onClick={() => handleStartEdit(product)}
                      aria-label={`Modifier ${product.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>

                <dl className="ps-catalog-card__metrics">
                  <div>
                    <dt>Prix vente</dt>
                    <dd>{formatMoney(product.salePrice)}</dd>
                  </div>
                  <div>
                    <dt>Prix achat</dt>
                    <dd>{product.costPrice != null ? formatMoney(product.costPrice) : '--'}</dd>
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
