import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

interface UpdateSettingsInput {
  hourlyRate: number;
  extraBlockMinutes: number;
  extraBlockPrice: number;
}

export const quadraService = {
  async getSettings(quadraId: string) {
    const quadra = await prisma.quadra.findUnique({
      where: { id: quadraId },
      select: { id: true, name: true, slug: true, hourlyRate: true, extraBlockMinutes: true, extraBlockPrice: true },
    });
    if (!quadra) throw new NotFoundError('Quadra');
    return quadra;
  },

  async updateSettings(quadraId: string, data: UpdateSettingsInput) {
    const quadra = await prisma.quadra.findUnique({ where: { id: quadraId } });
    if (!quadra) throw new NotFoundError('Quadra');

    return prisma.quadra.update({
      where: { id: quadraId },
      data,
      select: { id: true, name: true, slug: true, hourlyRate: true, extraBlockMinutes: true, extraBlockPrice: true },
    });
  },
};
