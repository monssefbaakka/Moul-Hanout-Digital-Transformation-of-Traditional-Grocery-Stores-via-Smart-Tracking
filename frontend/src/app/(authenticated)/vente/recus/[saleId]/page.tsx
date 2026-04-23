'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer } from 'lucide-react';
import type { SaleDetail } from '@moul-hanout/shared-types';
import { ApiError, salesApi } from '@/lib/api/api-client';
import { printSaleReceipt } from '@/lib/receipt-print';
import { useAuthStore } from '@/store/auth.store';

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

function getPaymentModeLabel(mode: SaleDetail['paymentMode']) {
  switch (mode) {
    case 'CASH':
      return 'Especes';
    case 'CARD':
      return 'Carte';
    case 'OTHER':
      return 'Autre';
    default:
      return mode;
  }
}

export default function SaleReceiptPage() {
  const params = useParams<{ saleId: string }>();
  const router = useRouter();
  const { hasHydrated, isAuthenticated } = useAuthStore();
  const [receipt, setReceipt] = useState<SaleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    let isMounted = true;

    async function loadReceipt() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const sale = await salesApi.getById(params.saleId);

        if (!isMounted) {
          return;
        }

        setReceipt(sale);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setReceipt(null);
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : 'Impossible de charger ce recu.',
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadReceipt();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isAuthenticated, params.saleId, router]);

  async function handlePrint() {
    if (!receipt) {
      return;
    }

    setIsPrinting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await printSaleReceipt(receipt);
      setStatusMessage(`Le recu ${receipt.receiptNumber} est pret pour impression.`);
    } catch {
      setErrorMessage("Impossible d'imprimer le recu pour le moment.");
    } finally {
      setIsPrinting(false);
    }
  }

  if (!hasHydrated || !isAuthenticated) {
    return (
      <main className="page">
        <section className="panel">
          <p>Chargement du recu...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page stack app-page">
      <section className="panel">
        <div className="inventory-table-head">
          <div>
            <span className="eyebrow">Recu de vente</span>
            <h1>{receipt?.receiptNumber ?? 'Ticket de caisse'}</h1>
            <p>Consultez le ticket complet apres validation et imprimez-le si necessaire.</p>
          </div>
          <div className="app-page-header__actions">
            <Link href="/vente" className="app-btn app-btn--secondary">
              Retour caisse
            </Link>
            <Link href="/ventes" className="app-btn app-btn--secondary">
              Historique
            </Link>
          </div>
        </div>
      </section>

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

      {isLoading ? (
        <section className="panel">
          <p>Chargement du recu...</p>
        </section>
      ) : null}

      {!isLoading && !receipt ? (
        <section className="panel">
          <p>Le recu demande est introuvable ou inaccessible pour cette boutique.</p>
        </section>
      ) : null}

      {receipt ? (
        <>
          <section className="app-dashboard-grid" aria-label="Resume du ticket">
            <article className="panel app-stat-card">
              <span className="eyebrow">Date</span>
              <strong>{formatDateTime(receipt.soldAt)}</strong>
              <p>Horodatage de la vente finalisee.</p>
            </article>
            <article className="panel app-stat-card">
              <span className="eyebrow">Caissier</span>
              <strong>{receipt.cashier.name}</strong>
              <p>{receipt.cashier.email}</p>
            </article>
            <article className="panel app-stat-card">
              <span className="eyebrow">Paiement</span>
              <strong>{getPaymentModeLabel(receipt.paymentMode)}</strong>
              <p>Total encaisse: {formatMoney(receipt.totalAmount)}</p>
            </article>
          </section>

          <section className="panel">
            <div className="inventory-table-head">
              <div>
                <h2>Lignes de vente</h2>
                <p>{receipt.items.reduce((count, item) => count + item.qty, 0)} article(s) sur ce ticket.</p>
              </div>
              <button
                type="button"
                className="app-btn app-btn--primary"
                onClick={() => void handlePrint()}
                disabled={isPrinting}
              >
                <Printer size={16} aria-hidden="true" />
                <span>{isPrinting ? 'Impression...' : 'Imprimer le recu'}</span>
              </button>
            </div>

            <div className="sales-history__line-list">
              {receipt.items.map((item) => (
                <article key={item.id} className="sales-history__line-item">
                  <div className="sales-history__line-item-header">
                    <div>
                      <strong>{item.product.name}</strong>
                      <p>{item.product.barcode ?? item.product.unit ?? 'Article standard'}</p>
                    </div>
                    <strong>{formatMoney(item.lineTotal - (item.discount ?? 0))}</strong>
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
                      <dt>Total ligne</dt>
                      <dd>{formatMoney(item.lineTotal)}</dd>
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

          <section className="panel">
            <div className="sales-history__totals">
              <div className="sales-history__detail-card">
                <span>Sous-total</span>
                <strong>{formatMoney(receipt.subtotal)}</strong>
              </div>
              <div className="sales-history__detail-card">
                <span>Total encaisse</span>
                <strong>{formatMoney(receipt.totalAmount)}</strong>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
