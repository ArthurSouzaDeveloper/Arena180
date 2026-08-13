import { prisma } from "../../config/database";
import { AppError } from "../../domain/errors";
import { decryptToken, encryptToken } from "../../infrastructure/crypto/tokenCipher";

function toPaymentSettings(quadra: { mercadoPagoAccessToken: string | null; allowDepositPayment: boolean; allowFullPayment: boolean }) {
  return {
    pixEnabled: Boolean(quadra.mercadoPagoAccessToken),
    allowDepositPayment: quadra.allowDepositPayment,
    allowFullPayment: quadra.allowFullPayment,
  };
}

function toWhatsappSettings(quadra: {
  whatsappAccessToken: string | null;
  whatsappPhoneNumberId: string | null;
  adminNotificationPhone: string | null;
  notifyBookingConfirmation: boolean;
  notifyBookingReminder: boolean;
  notifyMensalistaRenewal: boolean;
  notifyNewAvulsaBooking: boolean;
}) {
  return {
    whatsappEnabled: Boolean(quadra.whatsappAccessToken && quadra.whatsappPhoneNumberId),
    adminNotificationPhone: quadra.adminNotificationPhone,
    notifyBookingConfirmation: quadra.notifyBookingConfirmation,
    notifyBookingReminder: quadra.notifyBookingReminder,
    notifyMensalistaRenewal: quadra.notifyMensalistaRenewal,
    notifyNewAvulsaBooking: quadra.notifyNewAvulsaBooking,
  };
}

export const quadraSettingsService = {
  async getPaymentSettings(quadraId: string) {
    const quadra = await prisma.quadra.findUniqueOrThrow({ where: { id: quadraId } });
    return toPaymentSettings(quadra);
  },

  async savePixAccessToken(quadraId: string, accessToken: string) {
    const encrypted = encryptToken(accessToken);
    const quadra = await prisma.quadra.update({ where: { id: quadraId }, data: { mercadoPagoAccessToken: encrypted } });
    return toPaymentSettings(quadra);
  },

  async removePixAccessToken(quadraId: string) {
    const quadra = await prisma.quadra.update({ where: { id: quadraId }, data: { mercadoPagoAccessToken: null } });
    return toPaymentSettings(quadra);
  },

  async updatePaymentOptions(quadraId: string, options: { allowDepositPayment: boolean; allowFullPayment: boolean }) {
    if (!options.allowDepositPayment && !options.allowFullPayment) {
      throw new AppError("Selecione ao menos uma forma de pagamento pelo Pix");
    }
    const quadra = await prisma.quadra.update({
      where: { id: quadraId },
      data: {
        allowDepositPayment: options.allowDepositPayment,
        allowFullPayment: options.allowFullPayment,
      },
    });
    return toPaymentSettings(quadra);
  },

  async getWhatsappSettings(quadraId: string) {
    const quadra = await prisma.quadra.findUniqueOrThrow({ where: { id: quadraId } });
    return toWhatsappSettings(quadra);
  },

  async saveWhatsappCredentials(quadraId: string, accessToken: string, phoneNumberId: string) {
    const encrypted = encryptToken(accessToken);
    const quadra = await prisma.quadra.update({
      where: { id: quadraId },
      data: { whatsappAccessToken: encrypted, whatsappPhoneNumberId: phoneNumberId },
    });
    return toWhatsappSettings(quadra);
  },

  async removeWhatsappCredentials(quadraId: string) {
    const quadra = await prisma.quadra.update({
      where: { id: quadraId },
      data: { whatsappAccessToken: null, whatsappPhoneNumberId: null },
    });
    return toWhatsappSettings(quadra);
  },

  async updateNotificationSettings(
    quadraId: string,
    options: {
      adminNotificationPhone?: string | null;
      notifyBookingConfirmation: boolean;
      notifyBookingReminder: boolean;
      notifyMensalistaRenewal: boolean;
      notifyNewAvulsaBooking: boolean;
    },
  ) {
    const quadra = await prisma.quadra.update({
      where: { id: quadraId },
      data: {
        adminNotificationPhone: options.adminNotificationPhone,
        notifyBookingConfirmation: options.notifyBookingConfirmation,
        notifyBookingReminder: options.notifyBookingReminder,
        notifyMensalistaRenewal: options.notifyMensalistaRenewal,
        notifyNewAvulsaBooking: options.notifyNewAvulsaBooking,
      },
    });
    return toWhatsappSettings(quadra);
  },
};

export function decryptQuadraAccessToken(encrypted: string): string {
  return decryptToken(encrypted);
}
