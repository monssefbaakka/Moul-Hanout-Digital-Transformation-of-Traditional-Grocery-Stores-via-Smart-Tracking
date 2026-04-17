'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, Product } from '@moul-hanout/shared-types';
import { ApiError, categoriesApi, productsApi } from '@/lib/api/api-client';
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
};

const INITIAL_FORM: ProductFormState = {
  name: '',
  categoryId: '',
  salePrice: '',
  costPrice: '',
  barcode: '',
  description: '',
  unit: '',
  photo: '',
  lowStockThreshold: '5',
};

function buildPayload(form: ProductFormState) {
  return {
    name: form.name.trim(),
    categoryId: form.categoryId,
    salePrice: Number(form.salePrice),
    ...(form.costPrice ? { costPrice: Number(form.costPrice) } : {}),
    ...(form.barcode ? { barcode: form.barcode.trim() } : {}),
    ...(form.description ? { description: form.description.trim() } : {}),
    ...(form.unit ? { unit: form.unit.trim() } : {}),
    ...(form.photo ? { photo: form.photo.trim() } : {}),
    ...(form.lowStockThreshold ? { lowStockThreshold: Number(form.lowStockThreshold) } : {}),
  };
}

export function ProductsWorkspace() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormState>(INITIAL_FORM);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated || user?.role === 'CASHIER') {
      router.replace('/');
      return;
    }

    let isMounted = true;

    async function loadData() {
      try {
        const [categoryList, productList] = await Promise.all([
          categoriesApi.list(),
          productsApi.list(),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoryList);
        setProducts(productList);
        setForm((current) => ({
          ...current,
          categoryId: current.categoryId || categoryList[0]?.id || '',
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load product workspace',
        );
      }
    }

    void loadData();

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
      const createdProduct = await productsApi.create(buildPayload(form));
      setProducts((current) => [...current, createdProduct]);
      setStatusMessage(`Product ${createdProduct.name} created successfully.`);
      setForm((current) => ({
        ...INITIAL_FORM,
        categoryId: current.categoryId || categories[0]?.id || '',
      }));
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

  if (user?.role === 'CASHIER') {
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
        <span className="eyebrow">Produits</span>
        <h1>Owner product workspace</h1>
        <p>
          Create products from active categories only. Backend validation still decides pricing
          and barcode rules.
        </p>
      </section>

      <section className="products-layout">
        <article className="panel">
          <h2>Create a product</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Lait Demi-Ecreme 1L"
                required
              />
            </label>

            <label className="field">
              <span>Category</span>
              <select
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Sale price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(event) => setForm({ ...form, salePrice: event.target.value })}
                required
              />
            </label>

            <label className="field">
              <span>Cost price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={(event) => setForm({ ...form, costPrice: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Barcode</span>
              <input
                value={form.barcode}
                onChange={(event) => setForm({ ...form, barcode: event.target.value })}
                placeholder="220000000006"
              />
            </label>

            <label className="field">
              <span>Unit</span>
              <input
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
                placeholder="carton"
              />
            </label>

            <label className="field field-wide">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Short product description"
                rows={4}
              />
            </label>

            <label className="field">
              <span>Photo URL</span>
              <input
                value={form.photo}
                onChange={(event) => setForm({ ...form, photo: event.target.value })}
                placeholder="https://example.com/photo.jpg"
              />
            </label>

            <label className="field">
              <span>Low stock threshold</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.lowStockThreshold}
                onChange={(event) =>
                  setForm({ ...form, lowStockThreshold: event.target.value })
                }
              />
            </label>

            <div className="form-actions field-wide">
              <button className="button-link" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Create product'}
              </button>
            </div>
          </form>

          {statusMessage ? <p className="status-success">{statusMessage}</p> : null}
          {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>Active products</h2>
          <div className="product-list">
            {products.map((product) => (
              <article key={product.id} className="product-card">
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.category?.name ?? 'Unknown category'}</p>
                </div>
                <dl>
                  <div>
                    <dt>Sale</dt>
                    <dd>{product.salePrice}</dd>
                  </div>
                  <div>
                    <dt>Cost</dt>
                    <dd>{product.costPrice ?? '-'}</dd>
                  </div>
                  <div>
                    <dt>Barcode</dt>
                    <dd>{product.barcode ?? '-'}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
