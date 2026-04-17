export enum Role {
  OWNER = 'OWNER',
  CASHIER = 'CASHIER',
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string | string[];
  path: string;
  method: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export type User = AuthUser;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface LogoutResponse {
  message: string;
}

export interface Category {
  id: string;
  shopId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  unit?: string | null;
  photo?: string | null;
  barcode?: string | null;
  salePrice: number;
  costPrice?: number | null;
  lowStockThreshold: number;
  currentStock: number;
  category?: Category;
}

export interface CreateProductInput {
  name: string;
  categoryId: string;
  salePrice: number;
  costPrice?: number;
  barcode?: string;
  description?: string;
  isActive?: boolean;
  unit?: string;
  photo?: string;
  lowStockThreshold?: number;
}

export type UpdateProductInput = Partial<CreateProductInput>;
