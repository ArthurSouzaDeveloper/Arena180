import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

interface UpdateSettingsInput {
  hourlyRate: number;
  extraBlockMinutes: number;
  extraBlockPrice: number;
}

export const arenaService = {
  async getSettings(arenaId: string) {
    const arena = await prisma.arena.findUnique({
      where: { id: arenaId },
      select: { id: true, name: true, slug: true, hourlyRate: true, extraBlockMinutes: true, extraBlockPrice: true },
    });
    if (!arena) throw new NotFoundError('Arena');
    return arena;
  },

  async updateSettings(arenaId: string, data: UpdateSettingsInput) {
    const arena = await prisma.arena.findUnique({ where: { id: arenaId } });
    if (!arena) throw new NotFoundError('Arena');

    return prisma.arena.update({
      where: { id: arenaId },
      data,
      select: { id: true, name: true, slug: true, hourlyRate: true, extraBlockMinutes: true, extraBlockPrice: true },
    });
  },
};
