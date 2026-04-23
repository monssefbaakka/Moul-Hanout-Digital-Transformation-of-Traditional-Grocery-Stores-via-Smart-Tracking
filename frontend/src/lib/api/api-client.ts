import type {
  AlertItem,
  AdminUser,
  ApiResponse,
  AuthResponse,
  AuthTokens,
  Category,
  CreateSaleInput,
  CreateCategoryInput,
  CreateProductInput,
  CreateUserInput,
  DashboardReport,
  DailySummary,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  InventoryItem,
  InventoryReport,
  LogoutResponse,
  Product,
  ResetPasswordInput,
  ResetPasswordResponse,
  Sale,
  SaleDetail,
  SalesListResponse,
  SalesReport,
  StockInInput,
  StockMovementEntry,
  StockOutInput,
  UpdateProfileInput,
  UpdateProductInput,
} from '@moul-hanout/shared-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

type ProductUpdatePayload = Omit<
  UpdateProductInput,
  'barcode' | 'description' | 'unit' | 'photo' | 'costPrice' | 'expirationDate'
> & {
  barcode?: string | null;
  description?: string | null;
  unit?: string | null;
  photo?: string | null;
  costPrice?: number | null;
  expirationDate?: string | null;
};

function buildQuery(params?: Record<string, string | number | undefined>) {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<AuthResponse | null> | null = null;
let authFailureHandler: (() => void) | null = null;

export function setTokens(tokens: AuthTokens) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function registerAuthFailureHandler(handler: (() => void) | null) {
  authFailureHandler = handler;
}

function handleAuthFailure() {
  clearTokens();
  authFailureHandler?.();
}

async function refreshTokens(): Promise<AuthResponse | null> {
  if (!refreshToken) {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const payload = (await response.json()) as ApiResponse<AuthResponse>;
      setTokens(payload.data);
      return payload.data;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(typeof window !== 'undefined' && accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, requestInit);

  if (response.status === 401 && typeof window !== 'undefined' && endpoint !== '/auth/refresh') {
    const refreshed = await refreshTokens();
    if (refreshed && accessToken) {
      requestInit.headers = {
        ...(requestInit.headers as Record<string, string>),
        Authorization: `Bearer ${accessToken}`,
      };
      response = await fetch(`${BASE_URL}${endpoint}`, requestInit);
    } else {
      handleAuthFailure();
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(response.status, errorBody.error ?? 'Request failed', endpoint);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
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

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload: CreateUserInput) =>
    request<AdminUser>('/auth/register', { method: 'POST', body: payload }),
  forgotPassword: (payload: ForgotPasswordInput) =>
    request<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: payload,
    }),
  resetPassword: (payload: ResetPasswordInput) =>
    request<ResetPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      body: payload,
    }),
  logout: () => request<LogoutResponse>('/auth/logout', { method: 'POST' }),
  refresh: (token: string) =>
    request<AuthResponse>('/auth/refresh', { method: 'POST', body: { refreshToken: token } }),
};

export const usersApi = {
  me: () => request<AdminUser>('/users/me'),
  updateMe: (payload: UpdateProfileInput) =>
    request<AdminUser>('/users/me', { method: 'PATCH', body: payload }),
  list: () => request<AdminUser[]>('/users'),
  deactivate: (userId: string) =>
    request<AdminUser>(`/users/${userId}/deactivate`, { method: 'PATCH' }),
  activate: (userId: string) =>
    request<AdminUser>(`/users/${userId}/activate`, { method: 'PATCH' }),
};

export const categoriesApi = {
  list: () => request<Category[]>('/categories'),
  create: (payload: CreateCategoryInput) =>
    request<Category>('/categories', { method: 'POST', body: payload }),
  update: (id: string, payload: { name?: string; description?: string }) =>
    request<Category>(`/categories/${id}`, { method: 'PATCH', body: payload }),
  deactivate: (id: string) =>
    request<Category>(`/categories/${id}/deactivate`, { method: 'PATCH' }),
};

export const productsApi = {
  list: () => request<Product[]>('/products'),
  listAll: () => request<Product[]>('/products/manage'),
  create: (payload: CreateProductInput) =>
    request<Product>('/products', { method: 'POST', body: payload }),
  update: (productId: string, payload: ProductUpdatePayload) =>
    request<Product>(`/products/${productId}`, { method: 'PATCH', body: payload }),
};

export const reportsApi = {
  dashboard: () => request<DashboardReport>('/reports/dashboard'),
  salesReport: (params?: { from?: string; to?: string }) =>
    request<SalesReport>(`/reports/sales${buildQuery(params)}`),
  inventoryReport: (params?: { days?: number }) =>
    request<InventoryReport>(`/reports/inventory${buildQuery(params)}`),
  exportSalesCsv: (params?: { from?: string; to?: string }) =>
    downloadBlob(
      `/reports/sales/export${buildQuery(params)}`,
      `ventes-${params?.from ?? 'debut'}-${params?.to ?? 'fin'}.csv`,
    ),
};

export const inventoryApi = {
  list: () => request<InventoryItem[]>('/inventory'),
  stockIn: (payload: StockInInput) =>
    request<InventoryItem>('/inventory/stock-in', { method: 'POST', body: payload }),
  stockOut: (payload: StockOutInput) =>
    request<InventoryItem>('/inventory/stock-out', { method: 'POST', body: payload }),
  expiringSoon: () => request<InventoryItem[]>('/inventory/expiring-soon'),
  movements: () => request<StockMovementEntry[]>('/inventory/movements'),
};

export const alertsApi = {
  list: () => request<AlertItem[]>('/alerts'),
  markAsRead: (alertId: string) =>
    request<AlertItem>(`/alerts/${alertId}/read`, { method: 'PATCH' }),
};

async function downloadBlob(endpoint: string, filename: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      ...(typeof window !== 'undefined' && accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
    },
  });
  if (!response.ok) throw new Error('Export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const salesApi = {
  create: (payload: CreateSaleInput) =>
    request<SaleDetail>('/sales', { method: 'POST', body: payload }),
  list: (params?: { from?: string; to?: string; page?: number; limit?: number }) =>
    request<SalesListResponse>(`/sales${buildQuery(params)}`),
  getById: (id: string) => request<SaleDetail>(`/sales/${id}`),
  dailySummary: () => request<DailySummary>('/sales/summary/daily'),
};
