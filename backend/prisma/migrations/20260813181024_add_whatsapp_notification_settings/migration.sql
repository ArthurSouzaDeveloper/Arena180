-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "reminder_sent_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quadras" ADD COLUMN     "admin_notification_phone" TEXT,
ADD COLUMN     "notify_booking_confirmation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_booking_reminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_mensalista_renewal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_new_avulsa_booking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whatsapp_access_token" TEXT,
ADD COLUMN     "whatsapp_phone_number_id" TEXT;
