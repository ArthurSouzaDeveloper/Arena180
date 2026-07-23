import { prisma } from '../../config/prisma';
import { comparePassword, signAccessToken } from '../../utils/auth';
import { UnauthorizedError } from '../../utils/errors';
import { logger } from '../../config/logger';

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 2)}***@${domain}`;
}

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email }, include: { quadra: true } });
    if (!user || !user.active) {
      logger.warn('login_failed', { email: maskEmail(email), reason: user ? 'inactive_user' : 'user_not_found' });
      throw new UnauthorizedError('Credenciais inválidas');
    }
    if (user.quadra && !user.quadra.active) {
      logger.warn('login_failed', { email: maskEmail(email), reason: 'inactive_quadra', userId: user.id });
      throw new UnauthorizedError('Quadra inativa. Contate o suporte.');
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      logger.warn('login_failed', { email: maskEmail(email), reason: 'bad_password', userId: user.id });
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      quadraId: user.quadraId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        quadra: user.quadra ? { id: user.quadra.id, slug: user.quadra.slug, name: user.quadra.name } : null,
      },
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        quadra: { select: { id: true, slug: true, name: true } },
      },
    });
    if (!user) throw new UnauthorizedError();
    return user;
  },
};
