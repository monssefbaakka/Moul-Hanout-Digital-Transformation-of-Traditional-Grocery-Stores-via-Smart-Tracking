/**
 * api-client.ts
 * Typed HTTP client for the Moul Hanout Backend API.
 *
 * Based on the native `fetch` API (works in Next.js 15 App Router).
 * Handles:
 *  - JWT access token attachment
 *  - Automatic silent token refresh on 401
 *  - Uniform error handling
 *  - TypeScript generics for typed responses
 */

import type { ApiResponse, AuthTokens } from '@moul-hanout/shared-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  tags?: string[];          // Next.js cache tags
  revalidate?: number;      // Next.js ISR revalidation in seconds
}

let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function setTokens(tokens: AuthTokens) {
  _accessToken = tokens.accessToken;
  _refreshToken = tokens.refreshToken;
}

export function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
}

async function refreshTokens(): Promise<boolean> {
  if (!_refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: _refreshToken }),
    });
    if (!res.ok) return false;
    const { data } = (await res.json()) as ApiResponse<AuthTokens>;
    setTokens(data);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, tags, revalidate } = options;

  const fetchOptions: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(typeof window !== 'undefined' && _accessToken
        ? { Authorization: `Bearer ${_accessToken}` }
        : {}),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
    ...(tags || revalidate !== undefined
      ? { next: { ...(tags && { tags }), ...(revalidate !== undefined && { revalidate }) } }
      : {}),
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);

  // Silent refresh on 401
  if (response.status === 401 && typeof window !== 'undefined') {
    const refreshed = await refreshTokens();
    if (refreshed && _accessToken) {
      (fetchOptions.headers as Record<string, string>)['Authorization'] = `Bearer ${_accessToken}`;
      response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(response.status, error.error ?? 'Request failed', endpoint);
  }

  if (response.status === 204) return undefined as T;

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<AuthTokens>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (name: string, email: string, password: string) =>
    request('/auth/register', { method: 'POST', body: { name, email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  refresh: (refreshToken: string) =>
    request<AuthTokens>('/auth/refresh', { method: 'POST', body: { refreshToken } }),
};

// ─── Products ────────────────────────────────────────────────
export const productsApi = {
  list: (params?: { search?: string; categoryId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/products${qs ? `?${qs}` : ''}`, { tags: ['products'] });
  },
  get: (id: string) => request(`/products/${id}`, { tags: [`product-${id}`] }),
  getByBarcode: (barcode: string) => request(`/products/barcode/${barcode}`),
  create: (data: unknown) => request('/products', { method: 'POST', body: data }),
  update: (id: string, data: unknown) => request(`/products/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),
};

// ─── Categories ──────────────────────────────────────────────
export const categoriesApi = {
  list: () => request('/categories', { tags: ['categories'] }),
  get: (id: string) => request(`/categories/${id}`),
  create: (data: unknown) => request('/categories', { method: 'POST', body: data }),
  update: (id: string, data: unknown) => request(`/categories/${id}`, { method: 'PATCH', body: data }),
  delete: (id: string) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// ─── Stock ───────────────────────────────────────────────────
export const stockApi = {
  list: (status?: string) => request(`/stock${status ? `?status=${status}` : ''}`, { tags: ['stock'] }),
  lowStock: () => request('/stock/low-stock'),
  expired: () => request('/stock/expired'),
  adjust: (data: unknown) => request('/stock/adjust', { method: 'POST', body: data }),
};

// ─── Sales ───────────────────────────────────────────────────
export const salesApi = {
  list: (cashierId?: string) => request(`/sales${cashierId ? `?cashierId=${cashierId}` : ''}`),
  get: (id: string) => request(`/sales/${id}`),
  create: (data: unknown) => request('/sales', { method: 'POST', body: data }),
};

// ─── Reports ─────────────────────────────────────────────────
export const reportsApi = {
  dailySales: (date: string) => request(`/reports/daily-sales?date=${date}`),
  topProducts: (limit?: number) => request(`/reports/top-products${limit ? `?limit=${limit}` : ''}`),
  cashierPerformance: (startDate: string, endDate: string) =>
    request(`/reports/cashier-performance?startDate=${startDate}&endDate=${endDate}`),
  inventory: () => request('/reports/inventory'),
};
