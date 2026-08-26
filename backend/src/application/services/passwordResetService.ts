import bcrypt from "bcryptjs";
import { prisma } from "../../config/database";
import { AppError } from "../../domain/errors";
import { whatsappClient } from "../../infrastructure/whatsapp/whatsappClient";
import { decryptQuadraAccessToken } from "./quadraSettingsService";
import { logger } from "../../infrastructure/logging/logger";

const log = logger.child({ component: "passwordResetService" });

const CODE_TEMPLATE = "codigo_verificacao";
const CODE_TTL_MS = 10 * 60 * 1000;

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const passwordResetService = {
  // Always resolves without revealing whether the e-mail exists or why
  // sending failed (missing phone, arena without WhatsApp configured) -
  // the caller only ever sees a generic "if it exists, a code was sent".
  async requestReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { quadra: true },
    });

    if (!user || !user.phone || !user.quadra?.whatsappAccessToken || !user.quadra?.whatsappPhoneNumberId) {
      log.warn({ email, found: Boolean(user) }, "Solicitação de reset de senha não pôde ser atendida");
      return;
    }

    const code = generateCode();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetCode: code,
        passwordResetExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    try {
      const accessToken = decryptQuadraAccessToken(user.quadra.whatsappAccessToken);
      await whatsappClient.sendTemplateMessage({
        accessToken,
        phoneNumberId: user.quadra.whatsappPhoneNumberId,
        to: user.phone,
        templateName: CODE_TEMPLATE,
        bodyParams: [code],
      });
    } catch (err) {
      log.error({ err }, "Falha ao enviar código de redefinição de senha via WhatsApp");
    }
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      !user.passwordResetCode ||
      !user.passwordResetExpiresAt ||
      user.passwordResetCode !== code ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new AppError("Código inválido ou expirado", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetCode: null,
        passwordResetExpiresAt: null,
      },
    });
  },
};
