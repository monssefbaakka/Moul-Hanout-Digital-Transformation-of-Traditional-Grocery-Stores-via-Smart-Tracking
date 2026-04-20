'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatAlertTimestamp, getAlertHref, getAlertTypeLabel } from './alert-utils';
import { useAlerts } from './alerts-provider';

type AlertsDropdownProps = {
  compact?: boolean;
};

const MAX_DROPDOWN_ALERTS = 5;

export function AlertsDropdown({ compact = false }: AlertsDropdownProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { alerts, unreadCount, isLoading, markAlertAsRead } = useAlerts();
  const visibleAlerts = alerts.slice(0, MAX_DROPDOWN_ALERTS);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  async function openInventory(productAlertId: string, productId: string, isRead: boolean) {
    if (!isRead) {
      try {
        await markAlertAsRead(productAlertId);
      } catch {
        // Navigation remains more valuable than blocking the user here.
      }
    }

    setIsOpen(false);
    router.push(getAlertHref({ productId }));
  }

  return (
    <div ref={containerRef} className={cn('alerts-dropdown', compact && 'is-compact')}>
      <button
        type="button"
        className={cn('alerts-dropdown__trigger', compact && 'is-compact')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Ouvrir les alertes"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Bell size={18} />
        {!compact ? <span>Alertes</span> : null}
        {unreadCount > 0 ? (
          <span className="alerts-dropdown__count">{unreadCount > 9 ? '9+' : unreadCount}</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="alerts-dropdown__panel" role="dialog" aria-label="Centre d'alertes">
          <div className="alerts-dropdown__header">
            <div>
              <strong>Alertes du magasin</strong>
              <small>
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                  : 'Tout est traite'}
              </small>
            </div>
            <Link href="/alertes" className="alerts-dropdown__header-link" onClick={() => setIsOpen(false)}>
              Tout voir
            </Link>
          </div>

          <div className="alerts-dropdown__list">
            {isLoading && alerts.length === 0 ? (
              <p className="alerts-dropdown__empty">Chargement des alertes...</p>
            ) : null}

            {!isLoading && alerts.length === 0 ? (
              <p className="alerts-dropdown__empty">Aucune alerte active pour le moment.</p>
            ) : null}

            {visibleAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                className={cn('alerts-dropdown__item', !alert.isRead && 'is-unread')}
                onClick={() => openInventory(alert.id, alert.productId, alert.isRead)}
              >
                <div className="alerts-dropdown__item-top">
                  <span className={cn('alerts-type-pill', `is-${alert.type.toLowerCase().replace('_', '-')}`)}>
                    {getAlertTypeLabel(alert.type)}
                  </span>
                  <small>{formatAlertTimestamp(alert.createdAt)}</small>
                </div>
                <strong>{alert.productName}</strong>
                <p>{alert.message}</p>
                <span className="alerts-dropdown__item-link">
                  Ouvrir l&apos;inventaire
                  <ChevronRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
