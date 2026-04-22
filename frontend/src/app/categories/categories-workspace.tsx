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
  { id: 'bakery', label: 'Boulangerie', Icon: Croissant },
  { id: 'dairy', label: 'Laitiers', Icon: Milk },
  { id: 'drinks', label: 'Boissons', Icon: Coffee },
  { id: 'pantry', label: 'Epicerie', Icon: UtensilsCrossed },
  { id: 'home', label: 'Maison', Icon: House },
  { id: 'supplies', label: 'Fournitures', Icon: Package },
];

const DEFAULT_ICON_ID = CATEGORY_ICON_OPTIONS[0]?.id ?? 'produce';
const EMPTY_CATEGORY_LABEL = 'Produits frais';
const EMPTY_DESCRIPTION_LABEL =
  'Decrivez les articles de cette categorie pour les rapports et les tickets clients.';

function buildPayload(form: CategoryFormState) {
  const description = form.description.trim();

  return {
    name: form.name.trim(),
    ...(description ? { description } : {}),
  };
}

function buildUpdatePayload(form: CategoryFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormState>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingActionCategoryId, setPendingActionCategoryId] = useState<string | null>(null);
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

        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les categories.');
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
      setStatusMessage(`La categorie ${createdCategory.name} a ete creee avec succes.`);
      setForm(INITIAL_FORM);
      setSelectedIconId(DEFAULT_ICON_ID);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Impossible de creer la categorie pour le moment.');
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

  function handleEditStart(category: Category) {
    setEditingCategoryId(category.id);
    setEditForm({
      name: category.name,
      description: category.description ?? '',
    });
    setStatusMessage(null);
    setErrorMessage(null);
  }

  function handleEditCancel() {
    setEditingCategoryId(null);
    setEditForm(INITIAL_FORM);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>, categoryId: string) {
    event.preventDefault();
    setPendingActionCategoryId(categoryId);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const updatedCategory = await categoriesApi.update(categoryId, buildUpdatePayload(editForm));
      setCategories((current) => current.map((category) => (category.id === categoryId ? updatedCategory : category)));
      setEditingCategoryId(null);
      setEditForm(INITIAL_FORM);
      setStatusMessage(`La categorie ${updatedCategory.name} a ete mise a jour avec succes.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Impossible de mettre a jour la categorie pour le moment.');
      }
    } finally {
      setPendingActionCategoryId(null);
    }
  }

  async function handleDeactivate(category: Category) {
    if (!window.confirm(`Desactiver la categorie ${category.name} ?`)) {
      return;
    }

    setPendingActionCategoryId(category.id);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await categoriesApi.deactivate(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      if (editingCategoryId === category.id) {
        handleEditCancel();
      }
      setStatusMessage(`La categorie ${category.name} a ete desactivee.`);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Impossible de desactiver la categorie pour le moment.');
      }
    } finally {
      setPendingActionCategoryId(null);
    }
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="page">
        <section className="panel">
          <p>Chargement de l&apos;espace categories...</p>
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

  const selectedIcon =
    CATEGORY_ICON_OPTIONS.find((option) => option.id === selectedIconId) ?? CATEGORY_ICON_OPTIONS[0];
  const SelectedIcon = selectedIcon.Icon;
  const slugPreview = createCategorySlug(form.name);
  const previewName = form.name.trim() || EMPTY_CATEGORY_LABEL;
  const previewDescription = form.description.trim() || EMPTY_DESCRIPTION_LABEL;

  return (
    <main className="page stack app-page">
      <AppPageHeader
        title="Creer une categorie"
        subtitle="Organisez le catalogue avec des categories simples, faciles a reconnaitre et adaptees a votre equipe."
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
                  placeholder="Ex : Produits frais"
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
                  placeholder="Precisez quels produits doivent apparaitre dans cette categorie..."
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

            <div className="categories-icon-grid" aria-label="Choix des icones de categorie">
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
                  <span>0 article</span>
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
          className="app-btn app-btn--secondary app-btn--lg"
          onClick={handleDiscard}
          disabled={isSubmitting}
        >
          Annuler
        </button>

        <button
          type="submit"
          form="category-create-form"
          className="app-btn app-btn--primary app-btn--lg"
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
          {isLoading ? <p>Chargement des categories...</p> : null}
          {!isLoading && categories.length === 0 ? (
            <p>Aucune categorie pour le moment. Creez la premiere pour l&apos;utiliser dans les produits.</p>
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

                  {editingCategoryId === category.id ? (
                    <form className="category-library-card__edit" onSubmit={(event) => handleEditSubmit(event, category.id)}>
                      <label className="field">
                        <span>Nom categorie</span>
                        <input
                          value={editForm.name}
                          onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                          required
                          minLength={2}
                          maxLength={80}
                          disabled={pendingActionCategoryId === category.id}
                        />
                      </label>

                      <label className="field">
                        <span>Description</span>
                        <textarea
                          value={editForm.description}
                          onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                          rows={4}
                          maxLength={300}
                          disabled={pendingActionCategoryId === category.id}
                        />
                      </label>

                      <div className="category-library-card__actions">
                        <button
                          type="button"
                          className="app-btn app-btn--secondary app-btn--sm"
                          onClick={handleEditCancel}
                          disabled={pendingActionCategoryId === category.id}
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="app-btn app-btn--primary app-btn--sm"
                          disabled={pendingActionCategoryId === category.id || editForm.name.trim().length < 2}
                        >
                          {pendingActionCategoryId === category.id ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p>{category.description?.trim() || 'Aucune description fournie.'}</p>

                      <dl>
                        <div>
                          <dt>Slug</dt>
                          <dd>/cat/{createCategorySlug(category.name)}</dd>
                        </div>
                        <div>
                          <dt>Created</dt>
                          <dd>{new Date(category.createdAt).toLocaleDateString('fr-MA')}</dd>
                        </div>
                      </dl>

                      <div className="category-library-card__actions">
                        <button
                          type="button"
                          className="app-btn app-btn--secondary app-btn--sm"
                          onClick={() => handleEditStart(category)}
                          disabled={isSubmitting || pendingActionCategoryId === category.id}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className="app-btn app-btn--secondary app-btn--sm"
                          onClick={() => handleDeactivate(category)}
                          disabled={isSubmitting || pendingActionCategoryId === category.id}
                        >
                          {pendingActionCategoryId === category.id ? 'Desactivation...' : 'Desactiver'}
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))
            : null}
        </div>
      </section>
    </main>
  );
}
