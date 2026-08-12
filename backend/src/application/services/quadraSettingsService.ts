import { prisma } from "../../config/database";
import { decryptToken, encryptToken } from "../../infrastructure/crypto/tokenCipher";

export const quadraSettingsService = {
  async getPaymentSettings(quadraId: string) {
    const quadra = await prisma.quadra.findUniqueOrThrow({ where: { id: quadraId } });
    return { pixEnabled: Boolean(quadra.mercadoPagoAccessToken) };
  },

  async savePixAccessToken(quadraId: string, accessToken: string) {
    const encrypted = encryptToken(accessToken);
    await prisma.quadra.update({ where: { id: quadraId }, data: { mercadoPagoAccessToken: encrypted } });
    return { pixEnabled: true };
  },

  async removePixAccessToken(quadraId: string) {
    await prisma.quadra.update({ where: { id: quadraId }, data: { mercadoPagoAccessToken: null } });
    return { pixEnabled: false };
  },
};

export function decryptQuadraAccessToken(encrypted: string): string {
  return decryptToken(encrypted);
}
