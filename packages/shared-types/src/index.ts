// ============================================================
// @moul-hanout/shared-types
// Canonical type definitions shared between backend and frontend
// ============================================================

// ─── Enums ───────────────────────────────────────────────────
export enum Role {
  OWNER = 'OWNER',
  CASHIER = 'CASHIER',
}

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  EXPIRED = 'EXPIRED',
}

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
}

// ─── API Response Envelope ───────────────────────────────────
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

// ─── Domain Types ────────────────────────────────────────────
export interface User {
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

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  imageUrl?: string;
  isActive: boolean;
  categoryId: string;
  category?: Category;
  createdAt: string;
}

export interface StockItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  minQuantity: number;
  unit: string;
  expiryDate?: string;
  batchNumber?: string;
  status: StockStatus;
  location?: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  cashierId: string;
  cashier?: Pick<User, 'id' | 'name' | 'email'>;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  note?: string;
  saleItems: SaleItem[];
  createdAt: string;
}
