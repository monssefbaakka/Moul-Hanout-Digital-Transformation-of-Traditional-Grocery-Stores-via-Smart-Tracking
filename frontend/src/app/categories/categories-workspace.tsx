'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Coffee,
  Croissant,
  House,
  Leaf,
  Lightbulb,
  Milk,
  Package,
  UtensilsCrossed,
} from 'lucide-react';
import type { Category } from '@moul-hanout/shared-types';
import { ApiError, categoriesApi } from '@/lib/api/api-client';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { useAuthStore } from '@/store/auth.store';

type CategoryFormState = {
  name: string;
  description: string;
};

type CategoryIconOption = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

const INITIAL_FORM: CategoryFormState = {
  name: '',
  description: '',
};

const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 'produce', label: 'Fruits', Icon: Leaf },
  { id: 'bakery', label: 'Bakery', Icon: Croissant },
  { id: 'dairy', label: 'Dairy', Icon: Milk },
  { id: 'drinks', label: 'Drinks', Icon: Coffee },
  { id: 'pantry', label: 'Pantry', Icon: UtensilsCrossed },
  { id: 'home', label: 'Home', Icon: House },
  { id: 'supplies', label: 'Supplies', Icon: Package },
];

const DEFAULT_ICON_ID = CATEGORY_ICON_OPTIONS[0]?.id ?? 'produce';
const EMPTY_CATEGORY_LABEL = 'Fresh Produce';
const EMPTY_DESCRIPTION_LABEL =
  'Describe the items in this category for reporting and customer receipts.';

function buildPayload(form: CategoryFormState) {
  const description = form.description.trim();

  return {
    name: form.name.trim(),
    ...(description ? { description } : {}),
  };
}

function createCategorySlug(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'new-category'
  );
}

export function CategoriesWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(INITIAL_FORM);
  const [selectedIconId, setSelectedIconId] = useState(DEFAULT_ICON_ID);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated || user?.role !== 'OWNER') {
      router.replace('/');
      return;
    }

    let isMounted = true;

    async function loadCategories() {
      try {
        const list = await categoriesApi.list();

        if (!isMounted) {
          return;
        }

        setCategories(list);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Unable to load categories.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isAuthenticated, router, user?.role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const createdCategory = await categoriesApi.create(buildPayload(form));
      setCategories((current) => [...current, createdCategory]);
      setStatusMessage(`Category ${createdCategory.name} created successfully.`);
      setForm(INITIAL_FORM);
      setSelectedIconId(DEFAULT_ICON_ID);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to create the category right now.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDiscard() {
    setForm(INITIAL_FORM);
    setSelectedIconId(DEFAULT_ICON_ID);
    setStatusMessage(null);
    setErrorMessage(null);
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

  const selectedIcon =
    CATEGORY_ICON_OPTIONS.find((option) => option.id === selectedIconId) ?? CATEGORY_ICON_OPTIONS[0];
  const SelectedIcon = selectedIcon.Icon;
  const slugPreview = createCategorySlug(form.name);
  const previewName = form.name.trim() || EMPTY_CATEGORY_LABEL;
  const previewDescription = form.description.trim() || EMPTY_DESCRIPTION_LABEL;

  return (
    <main className="page stack app-page">
      <AppPageHeader
        eyebrow="Categories"
        title="Creer une categorie"
        description="Organisez le catalogue avec des categories simples, faciles a reconnaitre et adaptees a votre equipe."
      />

      {statusMessage ? <p className="status-success">{statusMessage}</p> : null}
      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}

      <section className="categories-studio">
        <form id="category-create-form" className="categories-editor-column" onSubmit={handleSubmit}>
          <article className="categories-card">
            <div className="categories-card-head">
              <div>
                <h2>Information categorie</h2>
                <p>Definissez l&apos;identite principale du groupe de produits.</p>
              </div>
            </div>

            <div className="categories-form-layout">
              <label className="field">
                <span>Nom categorie</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Fresh Produce"
                  required
                  minLength={2}
                  maxLength={80}
                  disabled={isSubmitting}
                />
              </label>

              <label className="field">
                <span>Slug URL</span>
                <div className="categories-slug-preview">/cat/{slugPreview}</div>
              </label>

              <label className="field field-wide">
                <span>Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Describe the items in this category for reporting and customer receipts..."
                  rows={5}
                  maxLength={300}
                  disabled={isSubmitting}
                />
              </label>
            </div>
          </article>

          <article className="categories-card">
            <div className="categories-card-head categories-card-head-inline">
              <div>
                <h2>Identite visuelle</h2>
                <p>Choisissez une icone simple pour le point de vente.</p>
              </div>
              <div className="categories-icon-badge">
                <strong>{CATEGORY_ICON_OPTIONS.length} Icones</strong>
                <span>Disponibles</span>
              </div>
            </div>

            <div className="categories-icon-grid" aria-label="Category icon choices">
              {CATEGORY_ICON_OPTIONS.map((option) => {
                const Icon = option.Icon;
                const isSelected = option.id === selectedIconId;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`categories-icon-option${isSelected ? ' is-selected' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedIconId(option.id)}
                    disabled={isSubmitting}
                  >
                    <span className="categories-icon-option__badge">
                      <Icon />
                    </span>
                    <span className="categories-icon-option__label">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </article>
        </form>

        <aside className="categories-preview-column">
          <article className="categories-preview-card">
            <div className="categories-preview-card__top">
              <span>Apercu caisse</span>
              <div className="categories-preview-card__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            </div>

            <div className="categories-preview-card__body">
              <h2>Poste de caisse</h2>

              <div className="categories-preview-grid">
                <article className="categories-preview-tile is-active">
                  <span className="categories-preview-tile__icon">
                    <SelectedIcon />
                  </span>
                  <strong>{previewName}</strong>
                  <span>0 items</span>
                </article>

                <article className="categories-preview-tile is-muted" aria-hidden="true">
                  <span className="categories-preview-tile__icon">
                    <Package />
                  </span>
                  <strong>Reserve</strong>
                  <span>Prochaine categorie</span>
                </article>
              </div>

              <div className="categories-preview-copy">
                <p>{previewDescription}</p>
              </div>

              <div className="categories-preview-skeleton" aria-hidden="true">
                <span className="line short" />
                <span className="line long" />
                <span className="line mid" />
                <span className="block" />
              </div>
            </div>
          </article>

          <article className="categories-tip-card">
            <div className="categories-tip-card__icon">
              <Lightbulb />
            </div>
            <div>
              <h3>Conseil utile</h3>
              <p>Utilisez des noms courts et des icones simples pour aider l&apos;equipe en caisse.</p>
            </div>
          </article>
        </aside>
      </section>

      <div className="categories-submit-bar">
        <button
          type="button"
          className="category-action category-action-secondary"
          onClick={handleDiscard}
          disabled={isSubmitting}
        >
          Annuler
        </button>

        <button
          type="submit"
          form="category-create-form"
          className="category-action category-action-primary"
          disabled={isSubmitting || form.name.trim().length === 0}
        >
          {isSubmitting ? 'Creation...' : 'Creer la categorie'}
        </button>
      </div>

      <section className="categories-library">
        <div className="categories-card-head">
          <div>
            <h2>Categories actives</h2>
            <p>Relisez les groupes deja disponibles pour la creation de produits.</p>
          </div>
        </div>

        <div className="categories-library-grid">
          {isLoading ? <p>Loading categories...</p> : null}
          {!isLoading && categories.length === 0 ? (
            <p>No categories yet. Create the first category to make it available in products.</p>
          ) : null}
          {!isLoading
            ? categories.map((category) => (
                <article key={category.id} className="category-library-card">
                  <div className="category-library-card__header">
                    <h3>{category.name}</h3>
                    <span className={category.isActive ? 'is-active' : 'is-inactive'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p>{category.description?.trim() || 'No description provided.'}</p>

                  <dl>
                    <div>
                      <dt>Slug</dt>
                      <dd>/cat/{createCategorySlug(category.name)}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{new Date(category.createdAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </article>
              ))
            : null}
        </div>
      </section>
    </main>
  );
}
