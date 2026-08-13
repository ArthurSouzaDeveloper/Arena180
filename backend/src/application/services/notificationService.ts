import { prisma } from "../../config/database";
import { decryptQuadraAccessToken } from "./quadraSettingsService";
import { whatsappClient } from "../../infrastructure/whatsapp/whatsappClient";

const TEMPLATES = {
  bookingConfirmation: "reserva_confirmada",
  bookingReminder: "lembrete_reserva",
  mensalistaRenewal: "renovacao_mensalista",
  newAvulsaBooking: "nova_reserva_avulsa",
};

interface QuadraWhatsappConfig {
  whatsappAccessToken: string | null;
  whatsappPhoneNumberId: string | null;
  adminNotificationPhone: string | null;
  notifyBookingConfirmation: boolean;
  notifyBookingReminder: boolean;
  notifyMensalistaRenewal: boolean;
  notifyNewAvulsaBooking: boolean;
}

async function sendSafely(quadra: QuadraWhatsappConfig, to: string, templateName: string, bodyParams: string[]) {
  if (!quadra.whatsappAccessToken || !quadra.whatsappPhoneNumberId) return;
  try {
    const accessToken = decryptQuadraAccessToken(quadra.whatsappAccessToken);
    await whatsappClient.sendTemplateMessage({
      accessToken,
      phoneNumberId: quadra.whatsappPhoneNumberId,
      to,
      templateName,
      bodyParams,
    });
  } catch (err) {
    console.error(`Falha ao enviar notificação WhatsApp (${templateName}):`, err);
  }
}

export const notificationService = {
  async sendBookingConfirmation(
    quadra: QuadraWhatsappConfig,
    booking: { customerName: string; customerPhone: string; date: string; startTime: string },
    courtName: string,
  ) {
    if (!quadra.notifyBookingConfirmation) return;
    await sendSafely(quadra, booking.customerPhone, TEMPLATES.bookingConfirmation, [
      booking.customerName,
      courtName,
      booking.date,
      booking.startTime,
    ]);
  },

  async sendBookingReminder(
    quadra: QuadraWhatsappConfig,
    booking: { customerName: string; customerPhone: string; startTime: string },
    courtName: string,
  ) {
    if (!quadra.notifyBookingReminder) return;
    await sendSafely(quadra, booking.customerPhone, TEMPLATES.bookingReminder, [
      booking.customerName,
      courtName,
      booking.startTime,
    ]);
  },

  async sendMensalistaRenewalReminder(
    quadra: QuadraWhatsappConfig,
    subscription: { customerName: string; customerPhone: string; weekdayLabel: string; startTime: string },
    courtName: string,
  ) {
    if (!quadra.notifyMensalistaRenewal) return;
    await sendSafely(quadra, subscription.customerPhone, TEMPLATES.mensalistaRenewal, [
      subscription.customerName,
      courtName,
      subscription.weekdayLabel,
      subscription.startTime,
    ]);
  },

  async sendNewAvulsaBookingAlert(
    quadra: QuadraWhatsappConfig,
    booking: { customerName: string; customerPhone: string; date: string; startTime: string },
    courtName: string,
  ) {
    if (!quadra.notifyNewAvulsaBooking || !quadra.adminNotificationPhone) return;
    await sendSafely(quadra, quadra.adminNotificationPhone, TEMPLATES.newAvulsaBooking, [
      courtName,
      booking.customerName,
      booking.customerPhone,
      booking.date,
      booking.startTime,
    ]);
  },
};

export async function findQuadraWhatsappConfig(quadraId: string): Promise<QuadraWhatsappConfig> {
  return prisma.quadra.findUniqueOrThrow({
    where: { id: quadraId },
    select: {
      whatsappAccessToken: true,
      whatsappPhoneNumberId: true,
      adminNotificationPhone: true,
      notifyBookingConfirmation: true,
      notifyBookingReminder: true,
      notifyMensalistaRenewal: true,
      notifyNewAvulsaBooking: true,
    },
  });
}
