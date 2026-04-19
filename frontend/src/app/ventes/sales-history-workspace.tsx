'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Sale, SaleStatus, SalesListPagination } from '@moul-hanout/shared-types';
import { salesApi } from '@/lib/api/api-client';
import { AppPageHeader } from '@/components/layout/app-page-header';
import { useAuthStore } from '@/store/auth.store';

const SALES_PAGE_SIZE = 20;

const INITIAL_PAGINATION: SalesListPagination = {
  page: 1,
  limit: SALES_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('fr-MA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getStatusClassName(status: SaleStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'inventory-status inventory-status-success';
    case 'PENDING':
      return 'inventory-status inventory-status-warning';
    case 'CANCELLED':
      return 'inventory-status inventory-status-danger';
    default:
      return 'inventory-status';
  }
}

function getStatusLabel(status: SaleStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'Completee';
    case 'PENDING':
      return 'En attente';
    case 'CANCELLED':
      return 'Annulee';
    default:
      return status;
  }
}

export function SalesHistoryWorkspace() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<SalesListPagination>(INITIAL_PAGINATION);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    let isMounted = true;

    async function loadSales() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await salesApi.list({
          page: currentPage,
          limit: SALES_PAGE_SIZE,
        });

        if (!isMounted) {
          return;
        }

        setSales(response.items);
        setPagination(response.pagination);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Impossible de charger l’historique des ventes.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSales();

    return () => {
      isMounted = false;
    };
  }, [currentPage, hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="page">
        <section className="panel">
          <p>Chargement de l&apos;historique des ventes...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page stack app-page">
      <AppPageHeader
        title="Historique des ventes"
        subtitle="Retrouvez les ventes deja enregistrees avec leur date, le caissier responsable, le total encaisse et le statut de chaque ticket."
        actions={
          <Link href="/vente" className="button-link">
            Ouvrir la caisse
          </Link>
        }
      />

      {errorMessage ? <p className="status-error" role="alert">{errorMessage}</p> : null}

      <section className="panel">
        <div className="inventory-table-head">
          <div>
            <h2>Tickets recents</h2>
            <p>
              {pagination.totalItems > 0
                ? `${pagination.totalItems} vente(s) trouvee(s) dans l'historique.`
                : 'Consultez les encaissements recents du magasin.'}
            </p>
          </div>
        </div>

        {isLoading ? <p>Chargement des ventes...</p> : null}
        {!isLoading && sales.length === 0 ? <p>Aucune vente enregistree pour le moment.</p> : null}

        {!isLoading && sales.length > 0 ? (
          <>
            <div className="app-table-wrapper">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ticket</th>
                    <th>Caissier</th>
                    <th>Total</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{formatDateTime(sale.soldAt)}</td>
                      <td>
                        <strong>{sale.receiptNumber}</strong>
                        <span>{sale.itemCount} article(s)</span>
                      </td>
                      <td>{sale.cashierName}</td>
                      <td>{formatMoney(sale.total)}</td>
                      <td>
                        <span className={getStatusClassName(sale.status)}>
                          {getStatusLabel(sale.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="inventory-table-head">
              <div>
                <p>
                  Page {pagination.page} sur {Math.max(pagination.totalPages, 1)} ·{' '}
                  {pagination.totalItems} vente(s)
                </p>
              </div>

              <div className="app-page-header__actions">
                <button
                  type="button"
                  className="app-btn app-btn--secondary"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Precedent
                </button>
                <button
                  type="button"
                  className="app-btn app-btn--secondary"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(pagination.totalPages || 1, page + 1))
                  }
                  disabled={
                    isLoading ||
                    pagination.totalPages === 0 ||
                    currentPage >= pagination.totalPages
                  }
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
