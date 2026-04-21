-- Drop the dead batch relation before removing the unused table.
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_batchId_fkey";

-- Remove the orphaned column from alerts.
ALTER TABLE "alerts" DROP COLUMN "batchId";

-- Remove the unused batch table from the MVP schema.
DROP TABLE "stock_batches";
