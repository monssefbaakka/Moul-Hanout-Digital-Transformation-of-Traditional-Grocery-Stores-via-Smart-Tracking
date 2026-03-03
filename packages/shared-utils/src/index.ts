// ============================================================
// @moul-hanout/shared-utils
// Pure utility functions with zero external dependencies.
// Safe to use in both Node.js (backend) and browser (frontend).
// ============================================================

/** Format a number as Moroccan Dirham currency. */
export function formatCurrency(amount: number, locale = 'ar-MA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Generate a padded sale number: SALE-YYYYMMDD-0001 */
export function generateSaleNumber(date: Date, sequence: number): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `SALE-${dateStr}-${String(sequence).padStart(4, '0')}`;
}

/** Compute sale totals from items. */
export function computeSaleTotals(
  items: Array<{ unitPrice: number; quantity: number; discount?: number }>,
  taxRate = 0.2,
  saleDiscount = 0,
) {
  const subtotal = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity - (i.discount ?? 0),
    0,
  );
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount - saleDiscount;
  return { subtotal, taxAmount, total };
}

/** Truncate a string to maxLength, appending '…' if needed. */
export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength - 1) + '…' : str;
}

/** Return initials from a full name (e.g. "John Doe" → "JD"). */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Convert a date to a human-readable local string. */
export function formatDate(date: string | Date, locale = 'fr-MA'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** Paginate an array (for client-side pagination fallback). */
export function paginate<T>(items: T[], page: number, limit: number): T[] {
  return items.slice((page - 1) * limit, page * limit);
}

/** Check if a stock item is expiring within N days. */
export function isExpiringSoon(expiryDate: string | Date, days = 7): boolean {
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  return diffMs > 0 && diffMs < days * 24 * 60 * 60 * 1000;
}
