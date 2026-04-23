ALTER TABLE "sale_items"
ADD COLUMN "lineTotal" DOUBLE PRECISION;

UPDATE "sale_items"
SET "lineTotal" = "qty" * "unitPrice"
WHERE "lineTotal" IS NULL;

ALTER TABLE "sale_items"
ALTER COLUMN "lineTotal" SET NOT NULL;
