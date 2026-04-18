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

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

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
  expirationDate?: string | null;
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
  expirationDate?: string;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export type StockMovementType = 'IN' | 'OUT' | 'ADJUST';

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  barcode?: string | null;
  unit?: string | null;
  currentStock: number;
  lowStockThreshold: number;
  expirationDate?: string | null;
  isLowStock: boolean;
  isExpiringSoon: boolean;
}

export interface StockMovementEntry {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantityDelta: number;
  reason?: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface StockInInput {
  productId: string;
  quantity: number;
  reason: string;
  expirationDate?: string;
}

export interface StockOutInput {
  productId: string;
  quantity: number;
  reason: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}
