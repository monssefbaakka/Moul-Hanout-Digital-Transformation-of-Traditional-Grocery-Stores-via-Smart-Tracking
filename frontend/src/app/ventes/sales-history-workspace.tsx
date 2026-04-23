"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Printer } from "lucide-react";
import type {
  PaymentMode,
  PaymentStatus,
  Sale,
  SaleDetail,
  SaleStatus,
  SalesListPagination,
} from "@moul-hanout/shared-types";
import { salesApi } from "@/lib/api/api-client";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { printSaleReceipt } from "@/lib/receipt-print";
import { useAuthStore } from "@/store/auth.store";

const SALES_PAGE_SIZE = 20;

const INITIAL_PAGINATION: SalesListPagination = {
  page: 1,
  limit: SALES_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClassName(status: SaleStatus) {
  switch (status) {
    case "COMPLETED":
      return "inventory-status inventory-status-success";
    case "PENDING":
      return "inventory-status inventory-status-warning";
    case "CANCELLED":
      return "inventory-status inventory-status-danger";
    default:
      return "inventory-status";
  }
}

function getStatusLabel(status: SaleStatus) {
  switch (status) {
    case "COMPLETED":
      return "Completee";
    case "PENDING":
      return "En attente";
    case "CANCELLED":
      return "Annulee";
    default:
      return status;
  }
}

function getPaymentModeLabel(mode: PaymentMode) {
  switch (mode) {
    case "CASH":
      return "Especes";
    case "CARD":
      return "Carte";
    case "OTHER":
      return "Autre";
    default:
      return mode;
  }
}

function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "COMPLETED":
      return "Complete";
    case "PENDING":
      return "En attente";
    case "CANCELLED":
      return "Annule";
    default:
      return status;
  }
}

export function SalesHistoryWorkspace() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] =
    useState<SalesListPagination>(INITIAL_PAGINATION);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [printingSaleId, setPrintingSaleId] = useState<string | null>(null);
  const [loadingSaleDetailId, setLoadingSaleDetailId] = useState<string | null>(
    null,
  );
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
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
          error instanceof Error
            ? error.message
            : "Impossible de charger l'historique des ventes.",
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

  const pageRevenue = useMemo(
    () => sales.reduce((sum, sale) => sum + sale.total, 0),
    [sales],
  );

  async function handlePrintSale(saleId: string) {
    setPrintingSaleId(saleId);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const receipt = await salesApi.getById(saleId);
      await printSaleReceipt(receipt);
      setStatusMessage(
        `Le recu ${receipt.receiptNumber} est pret pour impression.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'imprimer ce recu.",
      );
    } finally {
      setPrintingSaleId(null);
    }
  }

  async function handleViewSaleDetails(saleId: string) {
    setLoadingSaleDetailId(saleId);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const saleDetail = await salesApi.getById(saleId);
      setSelectedSale(saleDetail);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de charger les details de cette vente.",
      );
    } finally {
      setLoadingSaleDetailId(null);
    }
  }

  async function handlePrintSelectedSale() {
    if (!selectedSale) {
      return;
    }

    setPrintingSaleId(selectedSale.id);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await printSaleReceipt(selectedSale);
      setStatusMessage(
        `Le recu ${selectedSale.receiptNumber} est pret pour impression.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'imprimer ce recu.",
      );
    } finally {
      setPrintingSaleId(null);
    }
  }

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
          <Link href="/vente" className="app-btn app-btn--primary">
            Ouvrir la caisse
          </Link>
        }
      />

      {statusMessage ? (
        <p className="status-success" role="status">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="status-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <section className="app-dashboard-grid" aria-label="Resume des ventes">
        <article className="panel app-stat-card">
          <span className="eyebrow">Ventes chargees</span>
          <strong>{isLoading ? "..." : sales.length}</strong>
          <p>Nombre de tickets actuellement affiches sur cette page.</p>
        </article>
        <article className="panel app-stat-card">
          <span className="eyebrow">Historique total</span>
          <strong>{isLoading ? "..." : pagination.totalItems}</strong>
          <p>Nombre total de ventes disponibles dans l&apos;historique.</p>
        </article>
        <article className="panel app-stat-card">
          <span className="eyebrow">Montant page</span>
          <strong>{isLoading ? "..." : formatMoney(pageRevenue)}</strong>
          <p>Total cumule des tickets visibles sur la page actuelle.</p>
        </article>
      </section>

      <section className="panel">
        <div className="inventory-table-head">
          <div>
            <h2>Tickets recents</h2>
            <p>
              {pagination.totalItems > 0
                ? `${pagination.totalItems} vente(s) trouvee(s) dans l'historique.`
                : "Consultez les encaissements recents du magasin."}
            </p>
          </div>
        </div>

        {isLoading ? <p>Chargement des ventes...</p> : null}
        {!isLoading && sales.length === 0 ? (
          <p>Aucune vente enregistree pour le moment.</p>
        ) : null}

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
                    <th>Actions</th>
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
                      <td>
                        <div className="sales-history__actions">
                          <button
                            type="button"
                            className="app-btn app-btn--secondary app-btn--sm"
                            onClick={() => void handleViewSaleDetails(sale.id)}
                            disabled={loadingSaleDetailId === sale.id}
                          >
                            <Eye size={14} aria-hidden="true" />
                            <span>
                              {loadingSaleDetailId === sale.id
                                ? "Chargement..."
                                : "Voir details"}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="app-btn app-btn--secondary app-btn--sm"
                            onClick={() => void handlePrintSale(sale.id)}
                            disabled={printingSaleId === sale.id}
                          >
                            <Printer size={14} aria-hidden="true" />
                            <span>
                              {printingSaleId === sale.id
                                ? "Generation..."
                                : "Imprimer"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="inventory-table-head">
              <div>
                <p>
                  Page {pagination.page} sur{" "}
                  {Math.max(pagination.totalPages, 1)} | {pagination.totalItems}{" "}
                  vente(s)
                </p>
              </div>

              <div className="app-page-header__actions">
                <button
                  type="button"
                  className="app-btn app-btn--secondary"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage <= 1 || isLoading}
                >
                  Precedent
                </button>
                <button
                  type="button"
                  className="app-btn app-btn--secondary"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(pagination.totalPages || 1, page + 1),
                    )
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

      {selectedSale ? (
        <div
          className="app-modal-backdrop"
          role="none"
          onClick={() => setSelectedSale(null)}
        >
          <section
            className="app-modal sales-history__detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="app-modal__header">
              <div>
                <span className="eyebrow">Ticket detaille</span>
                <h2 id="sale-detail-title">Details de la vente</h2>
                <p>{selectedSale.receiptNumber}</p>
              </div>
              <button
                type="button"
                className="app-btn app-btn--secondary"
                onClick={() => setSelectedSale(null)}
                disabled={printingSaleId === selectedSale.id}
              >
                Fermer
              </button>
            </div>

            <div className="sales-history__detail-grid">
              <article className="sales-history__detail-card">
                <span>Date</span>
                <strong>{formatDateTime(selectedSale.soldAt)}</strong>
              </article>
              <article className="sales-history__detail-card">
                <span>Caissier</span>
                <strong>{selectedSale.cashier.name}</strong>
                <small>{selectedSale.cashier.email}</small>
              </article>
              <article className="sales-history__detail-card">
                <span>Paiement</span>
                <strong>{getPaymentModeLabel(selectedSale.paymentMode)}</strong>
              </article>
              <article className="sales-history__detail-card">
                <span>Statut</span>
                <strong>
                  <span className={getStatusClassName(selectedSale.status)}>
                    {getStatusLabel(selectedSale.status)}
                  </span>
                </strong>
              </article>
            </div>

            <section className="sales-history__detail-section">
              <div className="inventory-table-head">
                <div>
                  <h3>Articles vendus</h3>
                  <p>
                    {selectedSale.items.reduce(
                      (count, item) => count + item.qty,
                      0,
                    )}{" "}
                    article(s) sur ce ticket.
                  </p>
                </div>
              </div>

              <div className="sales-history__line-list">
                {selectedSale.items.map((item) => (
                  <article key={item.id} className="sales-history__line-item">
                    <div className="sales-history__line-item-header">
                      <div>
                        <strong>{item.product.name}</strong>
                        <p>
                          {item.product.barcode ??
                            item.product.unit ??
                            "Article standard"}
                        </p>
                      </div>
                      <strong>
                        {formatMoney(item.lineTotal - (item.discount ?? 0))}
                      </strong>
                    </div>

                    <dl className="sales-history__line-meta">
                      <div>
                        <dt>Quantite</dt>
                        <dd>{item.qty}</dd>
                      </div>
                      <div>
                        <dt>Prix unitaire</dt>
                        <dd>{formatMoney(item.unitPrice)}</dd>
                      </div>
                      <div>
                        <dt>Remise</dt>
                        <dd>{formatMoney(item.discount ?? 0)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>

            <section className="sales-history__detail-section">
              <div className="inventory-table-head">
                <div>
                  <h3>Paiements</h3>
                  <p>Trace des encaissements associes a cette vente.</p>
                </div>
              </div>

              {selectedSale.payments.length === 0 ? (
                <p>Aucun paiement enregistre pour cette vente.</p>
              ) : (
                <div className="sales-history__payment-list">
                  {selectedSale.payments.map((payment) => (
                    <article
                      key={payment.id}
                      className="sales-history__payment-item"
                    >
                      <div className="sales-history__payment-item-header">
                        <div>
                          <span>Mode</span>
                          <strong>
                            {getPaymentModeLabel(payment.paymentMethod)}
                          </strong>
                        </div>
                        <div>
                          <span>Statut</span>
                          <strong>
                            {getPaymentStatusLabel(payment.status)}
                          </strong>
                        </div>
                        <div>
                          <span>Montant</span>
                          <strong>{formatMoney(payment.amount)}</strong>
                        </div>
                        <div>
                          <span>Encaisse le</span>
                          <strong>{formatDateTime(payment.paidAt)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="sales-history__totals">
              <div className="sales-history__detail-card">
                <span>Sous-total</span>
                <strong>{formatMoney(selectedSale.subtotal)}</strong>
              </div>
              <div className="sales-history__detail-card">
                <span>Total encaisse</span>
                <strong>{formatMoney(selectedSale.totalAmount)}</strong>
              </div>
            </div>

            <div className="app-modal__footer">
              <p>Le ticket complet reste disponible pour verification et impression.</p>
              <div className="sales-history__modal-actions">
                <button
                  type="button"
                  className="app-btn app-btn--secondary"
                  onClick={() => void handlePrintSelectedSale()}
                  disabled={printingSaleId === selectedSale.id}
                >
                  <Printer size={16} aria-hidden="true" />
                  <span>
                    {printingSaleId === selectedSale.id
                      ? "Impression..."
                      : "Imprimer le recu"}
                  </span>
                </button>
                <button
                  type="button"
                  className="app-btn app-btn--primary"
                  onClick={() => setSelectedSale(null)}
                  disabled={printingSaleId === selectedSale.id}
                >
                  Fermer
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
