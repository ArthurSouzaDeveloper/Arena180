import { prisma } from '../../config/prisma';
import { comparePassword, signAccessToken } from '../../utils/auth';
import { UnauthorizedError } from '../../utils/errors';
import { logger } from '../../config/logger';
import { maskEmail } from '../../utils/mask';

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email }, include: { arena: true } });
    if (!user || !user.active) {
      logger.warn('login_failed', { email: maskEmail(email), reason: user ? 'inactive_user' : 'user_not_found' });
      throw new UnauthorizedError('Credenciais inválidas');
    }
    if (user.arena && !user.arena.active) {
      logger.warn('login_failed', { email: maskEmail(email), reason: 'inactive_arena', userId: user.id });
      throw new UnauthorizedError('Arena inativa. Contate o suporte.');
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
      arenaId: user.arenaId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        arena: user.arena
          ? {
              id: user.arena.id,
              slug: user.arena.slug,
              name: user.arena.name,
              hourlyRate: user.arena.hourlyRate,
              extraBlockMinutes: user.arena.extraBlockMinutes,
              extraBlockPrice: user.arena.extraBlockPrice,
            }
          : null,
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
        arena: {
          select: {
            id: true,
            slug: true,
            name: true,
            hourlyRate: true,
            extraBlockMinutes: true,
            extraBlockPrice: true,
          },
        },
      },
    });
    if (!user) throw new UnauthorizedError();
    return user;
  },
};
