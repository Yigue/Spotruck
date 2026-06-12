-- Migración faltante para los campos agregados en wave1 (el schema los
-- declaraba pero las columnas no existían: rompía register/login/trucks)

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "driver_license_url" TEXT;

-- AlterTable
ALTER TABLE "trucks" ADD COLUMN     "documents_url" TEXT[];
