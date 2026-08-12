-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PENDENTE_PAGAMENTO';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "deposit_amount" DECIMAL(10,2),
ADD COLUMN     "hold_expires_at" TIMESTAMP(3),
ADD COLUMN     "pix_payment_id" TEXT;

-- AlterTable
ALTER TABLE "quadras" ADD COLUMN     "mercado_pago_access_token" TEXT;
