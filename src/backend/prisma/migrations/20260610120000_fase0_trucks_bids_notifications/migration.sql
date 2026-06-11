-- CreateEnum
CREATE TYPE "TruckType" AS ENUM ('JAULA', 'SEMI', 'TOLVA', 'BATEA', 'FURGON', 'REFRIGERADO', 'PLAYO', 'OTRO');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferred_zone" TEXT,
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "sector" TEXT;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "origin_province" TEXT,
ADD COLUMN     "origin_city" TEXT,
ADD COLUMN     "dest_province" TEXT,
ADD COLUMN     "dest_city" TEXT,
ADD COLUMN     "distance_km" DOUBLE PRECISION,
ADD COLUMN     "duration_min" INTEGER,
ADD COLUMN     "volume_desc" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "bids" ADD COLUMN     "note" TEXT,
ADD COLUMN     "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "truck_id" TEXT;

-- CreateTable
CREATE TABLE "trucks" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "type" "TruckType" NOT NULL,
    "capacity_kg" DOUBLE PRECISION NOT NULL,
    "preferred_cargo" "CargoType",
    "senasa_number" TEXT,
    "insurance" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trucks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "payload" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trucks_plate_key" ON "trucks"("plate");

-- CreateIndex
CREATE INDEX "trucks_owner_id_idx" ON "trucks"("owner_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_truck_id_fkey" FOREIGN KEY ("truck_id") REFERENCES "trucks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
