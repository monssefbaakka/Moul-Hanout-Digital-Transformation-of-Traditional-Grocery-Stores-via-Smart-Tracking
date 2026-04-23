import type { PaymentMode, SaleDetail } from "@moul-hanout/shared-types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatReceiptMoney(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatReceiptDateTime(value: string) {
  return new Date(value).toLocaleString("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getReceiptPaymentModeLabel(mode: PaymentMode) {
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

function buildReceiptHtml(receipt: SaleDetail) {
  const totalDiscount = receipt.items.reduce(
    (sum, item) => sum + (item.discount ?? 0),
    0,
  );

  const itemsMarkup = receipt.items
    .map((item) => {
      const lineTotal = item.lineTotal - (item.discount ?? 0);

      return `
        <div class="receipt-line">
          <div>
            <strong>${escapeHtml(item.product.name)}</strong>
            <div class="receipt-line-meta">
              ${item.qty} x ${escapeHtml(formatReceiptMoney(item.unitPrice))}
              ${item.product.unit ? ` · ${escapeHtml(item.product.unit)}` : ""}
            </div>
          </div>
          <strong>${escapeHtml(formatReceiptMoney(lineTotal))}</strong>
        </div>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(receipt.receiptNumber)}</title>
        <style>
          :root {
            color-scheme: light;
            font-family: "Segoe UI", Arial, sans-serif;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #f3f6fb;
            color: #172033;
            padding: 24px;
          }

          .receipt-sheet {
            width: 360px;
            max-width: 100%;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #d7e1ec;
            border-radius: 18px;
            padding: 20px;
            box-shadow: 0 20px 50px rgba(20, 36, 62, 0.12);
          }

          .receipt-eyebrow {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #4f6b95;
            margin-bottom: 8px;
          }

          h1 {
            margin: 0;
            font-size: 24px;
            line-height: 1.1;
          }

          .receipt-number {
            margin: 6px 0 0;
            color: #5b6880;
          }

          .receipt-block,
          .receipt-total {
            margin-top: 16px;
            padding: 14px;
            border-radius: 14px;
            background: #f7faff;
            border: 1px solid #e2eaf4;
          }

          .receipt-meta {
            display: grid;
            gap: 12px;
          }

          .receipt-label {
            display: block;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #6d7b95;
            margin-bottom: 4px;
          }

          .receipt-line {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            padding: 10px 0;
            border-bottom: 1px dashed #d7e1ec;
          }

          .receipt-line:last-child {
            border-bottom: 0;
            padding-bottom: 0;
          }

          .receipt-line:first-child {
            padding-top: 0;
          }

          .receipt-line-meta {
            margin-top: 4px;
            color: #5b6880;
            font-size: 13px;
          }

          .receipt-total-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 8px;
          }

          .receipt-total-row:first-child {
            margin-top: 0;
          }

          .receipt-total-row--grand {
            font-size: 20px;
            font-weight: 800;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #d7e1ec;
          }

          .receipt-footer {
            margin-top: 18px;
            color: #5b6880;
            text-align: center;
            font-size: 12px;
          }

          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }

            .receipt-sheet {
              width: 100%;
              border: 0;
              border-radius: 0;
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="receipt-sheet">
          <span class="receipt-eyebrow">Recu de vente</span>
          <h1>Moul Hanout</h1>
          <p class="receipt-number">${escapeHtml(receipt.receiptNumber)}</p>

          <section class="receipt-block receipt-meta">
            <article>
              <span class="receipt-label">Date</span>
              <strong>${escapeHtml(formatReceiptDateTime(receipt.soldAt))}</strong>
            </article>
            <article>
              <span class="receipt-label">Caissier</span>
              <strong>${escapeHtml(receipt.cashier.name)}</strong>
            </article>
            <article>
              <span class="receipt-label">Paiement</span>
              <strong>${escapeHtml(getReceiptPaymentModeLabel(receipt.paymentMode))}</strong>
            </article>
          </section>

          <section class="receipt-block">
            ${itemsMarkup}
          </section>

          <section class="receipt-total">
            <div class="receipt-total-row">
              <span>Sous-total</span>
              <strong>${escapeHtml(formatReceiptMoney(receipt.subtotal))}</strong>
            </div>
            <div class="receipt-total-row">
              <span>Remise</span>
              <strong>${escapeHtml(formatReceiptMoney(totalDiscount))}</strong>
            </div>
            <div class="receipt-total-row--grand">
              <span>Total</span>
              <strong>${escapeHtml(formatReceiptMoney(receipt.totalAmount))}</strong>
            </div>
          </section>

          <p class="receipt-footer">Merci pour votre visite.</p>
        </main>
      </body>
    </html>
  `;
}

export async function printSaleReceipt(receipt: SaleDetail) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";

  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  const iframeDocument = iframeWindow?.document;

  if (!iframeWindow || !iframeDocument) {
    iframe.remove();
    throw new Error("Impossible d'ouvrir le recu pour impression.");
  }

  iframeDocument.open();
  iframeDocument.write(buildReceiptHtml(receipt));
  iframeDocument.close();

  await new Promise<void>((resolve) => {
    let completed = false;

    const complete = () => {
      if (completed) {
        return;
      }

      completed = true;
      iframeWindow.focus();
      iframeWindow.print();
      window.setTimeout(() => {
        iframe.remove();
        resolve();
      }, 300);
    };

    if (iframeDocument.readyState === "complete") {
      complete();
      return;
    }

    iframe.onload = () => complete();
    window.setTimeout(() => complete(), 500);
  });
}
