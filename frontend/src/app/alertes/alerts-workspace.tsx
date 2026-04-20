'use client';

import Link from 'next/link';
import { BellRing, CheckCircle2, ChevronRight, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { formatAlertTimestamp, getAlertHref, getAlertTypeLabel } from '@/components/alerts/alert-utils';
import { useAlerts } from '@/components/alerts/alerts-provider';

export function AlertsWorkspace() {
  const [showReadAlerts, setShowReadAlerts] = useState(true);
  const { alerts, unreadCount, isLoading, refreshAlerts, markAlertAsRead } = useAlerts();
  const visibleAlerts = showReadAlerts ? alerts : alerts.filter((alert) => !alert.isRead);

  return (
    <main className="page stack app-page">
      <AppPageHeader
        title="Alertes du magasin"
        subtitle="Surveillez les produits en stock bas et les articles proches de l'expiration depuis un seul espace."
        actions={
          <>
            <button type="button" className="app-btn app-btn--secondary" onClick={() => void refreshAlerts()}>
              <RefreshCcw size={16} />
              <span>{isLoading ? 'Actualisation...' : 'Actualiser'}</span>
            </button>
            <button
              type="button"
              className="app-btn app-btn--ghost"
              onClick={() => setShowReadAlerts((current) => !current)}
            >
              <span>{showReadAlerts ? 'Masquer les alertes lues' : 'Afficher tout'}</span>
            </button>
          </>
        }
      />

      <section className="alerts-overview" aria-label="Resume des alertes">
        <article className="alerts-overview__card">
          <span className="alerts-overview__label">Alertes totales</span>
          <strong>{alerts.length}</strong>
          <p>Toutes les alertes actuellement synchronisees avec l&apos;inventaire.</p>
        </article>
        <article className="alerts-overview__card is-emphasis">
          <span className="alerts-overview__label">Non lues</span>
          <strong>{unreadCount}</strong>
          <p>Gardez un oeil sur ce compteur depuis la navigation laterale.</p>
        </article>
      </section>

      {visibleAlerts.length === 0 ? (
        <section className="panel alerts-empty-state">
          <BellRing size={24} />
          <h2>Aucune alerte a afficher</h2>
          <p>
            {showReadAlerts
              ? "Le stock est dans un bon etat pour l&apos;instant."
              : 'Toutes les alertes restantes ont deja ete traitees.'}
          </p>
        </section>
      ) : (
        <section className="alerts-list" aria-label="Liste des alertes">
          {visibleAlerts.map((alert) => (
            <article key={alert.id} className={`alerts-card${alert.isRead ? '' : ' is-unread'}`}>
              <div className="alerts-card__top">
                <div>
                  <span className={`alerts-type-pill is-${alert.type.toLowerCase().replace('_', '-')}`}>
                    {getAlertTypeLabel(alert.type)}
                  </span>
                  <h2>{alert.productName}</h2>
                </div>
                <small>{formatAlertTimestamp(alert.createdAt)}</small>
              </div>

              <p className="alerts-card__message">{alert.message}</p>

              <dl className="alerts-card__meta">
                <div>
                  <dt>Stock actuel</dt>
                  <dd>
                    {alert.productCurrentStock} / {alert.productLowStockThreshold}
                  </dd>
                </div>
                <div>
                  <dt>Expiration</dt>
                  <dd>
                    {alert.expirationDate
                      ? new Date(alert.expirationDate).toLocaleDateString('fr-MA')
                      : 'Non suivie'}
                  </dd>
                </div>
              </dl>

              <div className="alerts-card__actions">
                <Link
                  href={getAlertHref(alert)}
                  className="app-btn app-btn--primary"
                  onClick={() => {
                    if (!alert.isRead) {
                      void markAlertAsRead(alert.id);
                    }
                  }}
                >
                  <span>Voir dans l&apos;inventaire</span>
                  <ChevronRight size={16} />
                </Link>
                {!alert.isRead ? (
                  <button
                    type="button"
                    className="app-btn app-btn--secondary"
                    onClick={() => void markAlertAsRead(alert.id)}
                  >
                    <CheckCircle2 size={16} />
                    <span>Marquer comme lue</span>
                  </button>
                ) : (
                  <span className="alerts-card__status">Alerte lue</span>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
