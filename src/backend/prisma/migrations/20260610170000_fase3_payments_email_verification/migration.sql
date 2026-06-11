-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verify_token" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "mercadopago_status" TEXT,
ADD COLUMN     "payment_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verify_token_key" ON "users"("email_verify_token");
