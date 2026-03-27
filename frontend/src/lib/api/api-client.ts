import type {
  ApiResponse,
  AuthResponse,
  AuthTokens,
  LogoutResponse,
} from '@moul-hanout/shared-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(tokens: AuthTokens) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

async function refreshTokens(): Promise<AuthResponse | null> {
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as ApiResponse<AuthResponse>;
    setTokens(payload.data);
    return payload.data;
  } catch {
    return null;
  }
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

  if (response.status === 401 && typeof window !== 'undefined') {
    const refreshed = await refreshTokens();
    if (refreshed && accessToken) {
      requestInit.headers = {
        ...(requestInit.headers as Record<string, string>),
        Authorization: `Bearer ${accessToken}`,
      };
      response = await fetch(`${BASE_URL}${endpoint}`, requestInit);
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
  register: (name: string, email: string, password: string) =>
    request('/auth/register', { method: 'POST', body: { name, email, password } }),
  logout: () => request<LogoutResponse>('/auth/logout', { method: 'POST' }),
  refresh: (token: string) =>
    request<AuthResponse>('/auth/refresh', { method: 'POST', body: { refreshToken: token } }),
};
