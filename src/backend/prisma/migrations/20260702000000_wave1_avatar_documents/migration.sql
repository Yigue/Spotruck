-- Wave 1: avatar y documentación de verificación por usuario (disco local)
ALTER TABLE "users"
  ADD COLUMN "avatar_url" TEXT,
  ADD COLUMN "documents_url" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
