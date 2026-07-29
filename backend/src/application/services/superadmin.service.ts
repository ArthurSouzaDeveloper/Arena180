import { prisma } from '../../config/prisma';
import { hashPassword } from '../../utils/auth';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { logger } from '../../config/logger';
import { maskEmail } from '../../utils/mask';

interface CreateArenaInput {
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export const superadminService = {
  async listArenas() {
    const arenas = await prisma.arena.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        createdAt: true,
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true, active: true },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { rachas: true, products: true } },
      },
    });

    return arenas.map(({ users, _count, ...arena }) => ({
      ...arena,
      admins: users,
      rachasCount: _count.rachas,
      productsCount: _count.products,
    }));
  },

  async createArena(input: CreateArenaInput) {
    const [slugTaken, emailTaken] = await Promise.all([
      prisma.arena.findUnique({ where: { slug: input.slug } }),
      prisma.user.findUnique({ where: { email: input.adminEmail } }),
    ]);
    if (slugTaken) throw new ConflictError('Já existe uma arena com esse identificador (slug)');
    if (emailTaken) throw new ConflictError('Já existe um usuário com esse e-mail');

    const passwordHash = await hashPassword(input.adminPassword);

    // Arena e admin nascem juntos: uma arena sem admin não teria como ser acessada.
    const arena = await prisma.arena.create({
      data: {
        name: input.name,
        slug: input.slug,
        users: {
          create: {
            name: input.adminName,
            email: input.adminEmail,
            passwordHash,
            role: 'ADMIN',
          },
        },
      },
      select: { id: true, name: true, slug: true, active: true, createdAt: true },
    });

    logger.info('arena_created_by_superadmin', {
      arenaId: arena.id,
      slug: arena.slug,
      adminEmail: maskEmail(input.adminEmail),
    });

    return arena;
  },

  async setArenaActive(arenaId: string, active: boolean) {
    const existing = await prisma.arena.findUnique({ where: { id: arenaId } });
    if (!existing) throw new NotFoundError('Arena');

    const arena = await prisma.arena.update({
      where: { id: arenaId },
      data: { active },
      select: { id: true, name: true, slug: true, active: true, createdAt: true },
    });

    logger.info('arena_active_changed', { arenaId: arena.id, active });
    return arena;
  },
};
