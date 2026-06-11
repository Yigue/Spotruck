-- Migración de dinero Float (double precision) → DECIMAL(12,2).
-- ROUND en el USING sanea cualquier drift de coma flotante existente.

-- AlterTable
ALTER TABLE "trips" ALTER COLUMN "base_price" TYPE DECIMAL(12,2) USING ROUND("base_price"::numeric, 2);

-- AlterTable
ALTER TABLE "auctions" ALTER COLUMN "current_price" TYPE DECIMAL(12,2) USING ROUND("current_price"::numeric, 2);
ALTER TABLE "auctions" ALTER COLUMN "reserve_price" TYPE DECIMAL(12,2) USING ROUND("reserve_price"::numeric, 2);

-- AlterTable
ALTER TABLE "bids" ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);
ALTER TABLE "payments" ALTER COLUMN "platform_fee" TYPE DECIMAL(12,2) USING ROUND("platform_fee"::numeric, 2);
ALTER TABLE "payments" ALTER COLUMN "net_amount" TYPE DECIMAL(12,2) USING ROUND("net_amount"::numeric, 2);
