-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "cancel_token" TEXT;

-- Backfill existing rows with a random token
UPDATE "bookings" SET "cancel_token" = gen_random_uuid()::text WHERE "cancel_token" IS NULL;

-- Make column required
ALTER TABLE "bookings" ALTER COLUMN "cancel_token" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_cancel_token_key" ON "bookings"("cancel_token");
