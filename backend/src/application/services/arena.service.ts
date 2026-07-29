import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

interface UpdateSettingsInput {
  bookingOpenTime: string;
  bookingCloseTime: string;
}

const arenaSettingsSelect = {
  id: true,
  name: true,
  slug: true,
  bookingOpenTime: true,
  bookingCloseTime: true,
} as const;

export const arenaService = {
  async getSettings(arenaId: string) {
    const arena = await prisma.arena.findUnique({ where: { id: arenaId }, select: arenaSettingsSelect });
    if (!arena) throw new NotFoundError('Arena');
    return arena;
  },

  async updateSettings(arenaId: string, data: UpdateSettingsInput) {
    const arena = await prisma.arena.findUnique({ where: { id: arenaId } });
    if (!arena) throw new NotFoundError('Arena');

    return prisma.arena.update({ where: { id: arenaId }, data, select: arenaSettingsSelect });
  },
};
