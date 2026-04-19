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

export type PaymentMode = 'CASH' | 'CARD' | 'OTHER';

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  discount?: number;
}

export interface CreateSaleInput {
  paymentMode: PaymentMode;
  items: CreateSaleItemInput[];
}

export interface Sale {
  id: string;
  receiptNumber: string;
  soldAt: string;
  status: SaleStatus;
  paymentMode: PaymentMode;
  cashierId: string;
  cashierName: string;
  total: number;
  itemCount: number;
}

export interface SalesListPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface SalesListFilters {
  from?: string | null;
  to?: string | null;
}

export interface SalesListResponse {
  items: Sale[];
  pagination: SalesListPagination;
  filters: SalesListFilters;
}

export interface SaleDetailCashier {
  id: string;
  name: string;
  email: string;
}

export interface SaleDetailItemProduct {
  id: string;
  name: string;
  barcode?: string | null;
  unit?: string | null;
}

export interface SaleDetailItem {
  id: string;
  saleId: string;
  productId: string;
  qty: number;
  unitPrice: number;
  discount?: number | null;
  product: SaleDetailItemProduct;
}

export interface SalePayment {
  id: string;
  saleId: string;
  amount: number;
  paymentMethod: PaymentMode;
  status: PaymentStatus;
  paidAt: string;
}

export interface SaleDetail {
  id: string;
  shopId: string;
  cashierUserId: string;
  receiptNumber: string;
  subtotal: number;
  totalAmount: number;
  status: SaleStatus;
  paymentMode: PaymentMode;
  soldAt: string;
  cashier: SaleDetailCashier;
  items: SaleDetailItem[];
  payments: SalePayment[];
}

export interface DailySummaryTopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface DailySummary {
  date: string;
  totalRevenue: number;
  transactionCount: number;
  topProducts: DailySummaryTopProduct[];
}

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

export interface SalesReportDay {
  date: string;
  revenue: number;
  transactions: number;
}

export interface SalesReport {
  days: SalesReportDay[];
  totalRevenue: number;
  totalTransactions: number;
}

export interface InventoryReportProduct {
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  unit?: string | null;
  categoryName: string;
}

export interface ExpiringProduct extends InventoryReportProduct {
  expirationDate: string | null;
}

export interface InventoryReport {
  lowStock: InventoryReportProduct[];
  expiringSoon: ExpiringProduct[];
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
