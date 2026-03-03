// Shared application-wide enums. These mirror Prisma enums
// so they can also be exported to the shared-types package.

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

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
