import { prisma } from "../../config/database";
import { NotFoundError, AppError } from "../../domain/errors";

const DEFAULT_OPEN_TIME = "08:00";
const DEFAULT_CLOSE_TIME = "23:00";

interface CreateCourtInput {
  quadraId: string;
  name: string;
  hourlyRate: number;
  extraBlockMinutes?: number;
  extraBlockPrice?: number;
}

interface UpdateCourtInput {
  name?: string;
  hourlyRate?: number;
  extraBlockMinutes?: number;
  extraBlockPrice?: number;
  active?: boolean;
}

interface CourtHoursInput {
  weekday: number;
  openTime: string;
  closeTime: string;
  closed: boolean;
}

interface CreateBlockInput {
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function assertValidTime(value: string, field: string) {
  if (!TIME_REGEX.test(value)) {
    throw new AppError(`${field} inválido, use o formato HH:MM`);
  }
}

async function assertOwnership(id: string, quadraId: string) {
  const court = await prisma.court.findFirst({ where: { id, quadraId } });
  if (!court) {
    throw new NotFoundError("Quadra não encontrada");
  }
  return court;
}

export const courtService = {
  list(quadraId: string) {
    return prisma.court.findMany({
      where: { quadraId },
      orderBy: { name: "asc" },
      include: {
        hours: { orderBy: { weekday: "asc" } },
        blocks: { where: { date: { gte: new Date() } }, orderBy: { date: "asc" } },
      },
    });
  },

  async create({ quadraId, name, hourlyRate, extraBlockMinutes, extraBlockPrice }: CreateCourtInput) {
    return prisma.court.create({
      data: {
        quadraId,
        name,
        hourlyRate,
        extraBlockMinutes: extraBlockMinutes ?? 0,
        extraBlockPrice,
        hours: {
          create: Array.from({ length: 7 }, (_, weekday) => ({
            weekday,
            openTime: DEFAULT_OPEN_TIME,
            closeTime: DEFAULT_CLOSE_TIME,
            closed: false,
          })),
        },
      },
      include: { hours: true },
    });
  },

  async update(id: string, quadraId: string, data: UpdateCourtInput) {
    await assertOwnership(id, quadraId);
    return prisma.court.update({ where: { id }, data });
  },

  async remove(id: string, quadraId: string) {
    await assertOwnership(id, quadraId);
    await prisma.court.delete({ where: { id } });
  },

  async setHours(id: string, quadraId: string, hours: CourtHoursInput[]) {
    await assertOwnership(id, quadraId);

    for (const entry of hours) {
      if (entry.weekday < 0 || entry.weekday > 6) {
        throw new AppError("Dia da semana inválido");
      }
      if (!entry.closed) {
        assertValidTime(entry.openTime, "Horário de abertura");
        assertValidTime(entry.closeTime, "Horário de fechamento");
        if (entry.openTime >= entry.closeTime) {
          throw new AppError("Horário de abertura deve ser antes do fechamento");
        }
      }
    }

    await prisma.$transaction(
      hours.map((entry) =>
        prisma.courtHours.upsert({
          where: { courtId_weekday: { courtId: id, weekday: entry.weekday } },
          create: { courtId: id, ...entry },
          update: {
            openTime: entry.openTime,
            closeTime: entry.closeTime,
            closed: entry.closed,
          },
        }),
      ),
    );

    return prisma.courtHours.findMany({ where: { courtId: id }, orderBy: { weekday: "asc" } });
  },

  async addBlock(id: string, quadraId: string, { date, startTime, endTime, reason }: CreateBlockInput) {
    await assertOwnership(id, quadraId);

    if (startTime) assertValidTime(startTime, "Horário inicial");
    if (endTime) assertValidTime(endTime, "Horário final");
    if (startTime && endTime && startTime >= endTime) {
      throw new AppError("Horário inicial deve ser antes do horário final");
    }

    return prisma.courtBlock.create({
      data: { courtId: id, date: new Date(date), startTime, endTime, reason },
    });
  },

  async removeBlock(id: string, quadraId: string, blockId: string) {
    await assertOwnership(id, quadraId);
    const block = await prisma.courtBlock.findFirst({ where: { id: blockId, courtId: id } });
    if (!block) {
      throw new NotFoundError("Bloqueio não encontrado");
    }
    await prisma.courtBlock.delete({ where: { id: blockId } });
  },
};
