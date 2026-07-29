import { prisma } from '../../config/prisma';
import { AppError, NotFoundError } from '../../utils/errors';

interface CreateCourtInput {
  name: string;
  hourlyRate: number;
  extraBlockMinutes: number;
  extraBlockPrice: number;
}

interface UpdateCourtInput extends Partial<CreateCourtInput> {
  active?: boolean;
}

/** Preço da locação: primeira hora + um bloco extra a cada N minutos adicionais. */
export function calculateCourtPrice(
  durationMinutes: number,
  court: { hourlyRate: unknown; extraBlockMinutes: number; extraBlockPrice: unknown },
): number {
  if (durationMinutes <= 0) return 0;
  const hourlyRate = Number(court.hourlyRate);
  const extraBlockPrice = Number(court.extraBlockPrice);
  const extraMinutes = Math.max(0, durationMinutes - 60);
  const extraBlocks = court.extraBlockMinutes > 0 ? Math.ceil(extraMinutes / court.extraBlockMinutes) : 0;
  return Math.round((hourlyRate + extraBlocks * extraBlockPrice) * 100) / 100;
}

export const courtService = {
  list(arenaId: string, includeInactive = false) {
    return prisma.court.findMany({
      where: { arenaId, ...(includeInactive ? {} : { active: true }) },
      orderBy: { name: 'asc' },
    });
  },

  async getOwned(arenaId: string, courtId: string) {
    const court = await prisma.court.findFirst({ where: { id: courtId, arenaId } });
    if (!court) throw new NotFoundError('Quadra');
    return court;
  },

  create(arenaId: string, input: CreateCourtInput) {
    return prisma.court.create({ data: { arenaId, ...input } });
  },

  async update(arenaId: string, courtId: string, input: UpdateCourtInput) {
    await this.getOwned(arenaId, courtId);
    return prisma.court.update({ where: { id: courtId }, data: input });
  },

  async remove(arenaId: string, courtId: string) {
    await this.getOwned(arenaId, courtId);

    // Soft delete: rachas antigas referenciam a quadra e precisam continuar
    // legíveis no histórico e no faturamento.
    const activeCount = await prisma.court.count({ where: { arenaId, active: true } });
    if (activeCount <= 1) {
      throw new AppError('A arena precisa ter ao menos uma quadra ativa', 400, 'LAST_ACTIVE_COURT');
    }

    return prisma.court.update({ where: { id: courtId }, data: { active: false } });
  },
};
