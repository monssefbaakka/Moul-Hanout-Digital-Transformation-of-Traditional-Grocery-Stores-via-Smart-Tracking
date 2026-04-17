'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category } from '@moul-hanout/shared-types';
import { ApiError, categoriesApi } from '@/lib/api/api-client';
import { useAuthStore } from '@/store/auth.store';

type CategoryFormState = {
  name: string;
  description: string;
};

const INITIAL_FORM: CategoryFormState = {
  name: '',
  description: '',
};

function buildPayload(form: CategoryFormState) {
  const description = form.description.trim();

  return {
    name: form.name.trim(),
    ...(description ? { description } : {}),
  };
}

export function CategoriesWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(INITIAL_FORM);
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

  return (
    <main className="page stack">
      <section className="hero">
        <span className="eyebrow">Categories</span>
        <h1>Owner category management</h1>
        <p>
          Create active categories for the shop and review the current list used by the product
          workspace.
        </p>
      </section>

      <section className="products-layout">
        <article className="panel">
          <h2>Create a category</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Boissons"
                required
                minLength={2}
                maxLength={80}
                disabled={isSubmitting}
              />
            </label>

            <label className="field field-wide">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Optional category note"
                rows={4}
                maxLength={300}
                disabled={isSubmitting}
              />
            </label>

            <div className="form-actions field-wide">
              <button
                className="button-link"
                type="submit"
                disabled={isSubmitting || form.name.trim().length === 0}
              >
                {isSubmitting ? 'Creating...' : 'Create category'}
              </button>
            </div>
          </form>

          {statusMessage ? <p className="status-success">{statusMessage}</p> : null}
          {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>Active categories</h2>
          <div className="product-list">
            {isLoading ? <p>Loading categories...</p> : null}
            {!isLoading && categories.length === 0 ? (
              <p>No categories yet. Create the first category to make it available in products.</p>
            ) : null}
            {!isLoading
              ? categories.map((category) => (
                  <article key={category.id} className="product-card">
                    <div>
                      <h3>{category.name}</h3>
                      <p>{category.description?.trim() || 'No description provided.'}</p>
                    </div>
                    <dl>
                      <div>
                        <dt>Created</dt>
                        <dd>{new Date(category.createdAt).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{category.isActive ? 'Active' : 'Inactive'}</dd>
                      </div>
                    </dl>
                  </article>
                ))
              : null}
          </div>
        </article>
      </section>
    </main>
  );
}
