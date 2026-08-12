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
};

export function decryptQuadraAccessToken(encrypted: string): string {
  return decryptToken(encrypted);
}
