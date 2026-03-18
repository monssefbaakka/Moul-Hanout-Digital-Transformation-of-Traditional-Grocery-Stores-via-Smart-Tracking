export function formatCurrency(amount: number, locale = 'ar-MA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function formatDate(date: string | Date, locale = 'fr-MA'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
