-- AlterTable
ALTER TABLE "alerts" ADD COLUMN "email_sent_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "alerts_shopId_emailSentAt_idx" ON "alerts"("shopId", "email_sent_at");
