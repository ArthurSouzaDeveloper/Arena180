-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('AGUARDANDO_PAGAMENTO', 'ATIVA', 'CANCELADA');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "subscription_id" TEXT;

-- AlterTable
ALTER TABLE "courts" ADD COLUMN     "mensalista_hourly_rate" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "court_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "price_per_occurrence" DECIMAL(10,2) NOT NULL,
    "deposit_amount" DECIMAL(10,2),
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "cancel_token" TEXT NOT NULL,
    "pix_payment_id" TEXT,
    "hold_expires_at" TIMESTAMP(3),
    "cycle_start_date" DATE NOT NULL,
    "last_renewal_notice_cycle_start" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_cancel_token_key" ON "subscriptions"("cancel_token");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
