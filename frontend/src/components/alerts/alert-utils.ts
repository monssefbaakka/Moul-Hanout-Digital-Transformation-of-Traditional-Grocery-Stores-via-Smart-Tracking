import type { AlertItem, AlertType } from '@moul-hanout/shared-types';

export function getAlertHref(alert: Pick<AlertItem, 'productId'>) {
  return `/inventaire?focus=${encodeURIComponent(alert.productId)}`;
}

export function getAlertTypeLabel(type: AlertType) {
  return type === 'LOW_STOCK' ? 'Stock bas' : 'Expiration';
}

export function formatAlertTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString('fr-MA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
