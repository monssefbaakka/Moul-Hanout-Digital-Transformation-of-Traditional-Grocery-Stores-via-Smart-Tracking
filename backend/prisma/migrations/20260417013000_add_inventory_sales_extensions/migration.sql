-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'EXPIRY');

-- AlterTable
ALTER TABLE "categories"
ADD COLUMN "description" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "products"
ADD COLUMN "description" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "photo" TEXT,
ADD COLUMN "unit" TEXT;

-- AlterTable
ALTER TABLE "sales"
ADD COLUMN "receiptNumber" TEXT,
ADD COLUMN "status" "SaleStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill existing rows safely before making receiptNumber required.
UPDATE "sales"
SET "receiptNumber" = 'SALE-' || "id"
WHERE "receiptNumber" IS NULL;

-- Remove temporary default so the database matches the Prisma schema.
ALTER TABLE "sales"
ALTER COLUMN "receiptNumber" SET NOT NULL,
ALTER COLUMN "subtotal" DROP DEFAULT;

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMode" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_batches" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "supplierId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_receiptNumber_key" ON "sales"("receiptNumber");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "stock_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
