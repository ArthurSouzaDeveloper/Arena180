-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('DEPOSITO', 'INTEGRAL');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "payment_mode" "PaymentMode";

-- AlterTable
ALTER TABLE "quadras" ADD COLUMN     "allow_deposit_payment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allow_full_payment" BOOLEAN NOT NULL DEFAULT false;
