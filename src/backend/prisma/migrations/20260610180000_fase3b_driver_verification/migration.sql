-- CreateEnum
CREATE TYPE "DocumentsStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "documents_status" "DocumentsStatus" NOT NULL DEFAULT 'NONE';
