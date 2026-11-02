-- Columnas que el schema declaraba desde "Testeo" sin migración (rompían
-- register/login/trucks en bases nuevas). Idempotente: es seguro correrla en
-- una base que ya las tenga (p. ej. creada con `prisma db push`).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "driver_license_url" TEXT;
ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "documents_url" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
