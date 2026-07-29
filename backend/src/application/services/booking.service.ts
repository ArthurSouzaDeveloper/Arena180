import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError, ConflictError, NotFoundError } from '../../utils/errors';
import { calculateCourtPrice } from './court.service';
import { logger } from '../../config/logger';

interface CreateBookingInput {
  courtId: string;
  startsAt: Date;
  durationMinutes: number;
  playerName: string;
  playerPhone: string;
}

/** "HH:mm" -> minutos desde a meia-noite. */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function endOfRacha(racha: { date: Date; durationMinutes: number }): Date {
  return new Date(racha.date.getTime() + racha.durationMinutes * 60_000);
}

async function findActiveArenaBySlug(slug: string) {
  const arena = await prisma.arena.findFirst({
    where: { slug, active: true },
    select: { id: true, name: true, slug: true, bookingOpenTime: true, bookingCloseTime: true },
  });
  if (!arena) throw new NotFoundError('Arena');
  return arena;
}

export const bookingService = {
  /** Dados públicos da arena + quadras ativas, para montar a tela de agendamento. */
  async getPublicArena(slug: string) {
    const arena = await findActiveArenaBySlug(slug);
    const courts = await prisma.court.findMany({
      where: { arenaId: arena.id, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, hourlyRate: true, extraBlockMinutes: true, extraBlockPrice: true },
    });
    return { ...arena, courts };
  },

  /**
   * Intervalos já ocupados de uma quadra num dia. O front usa isso para desabilitar
   * horários; a checagem que realmente vale é refeita na criação da reserva.
   */
  async getAvailability(slug: string, courtId: string, date: Date) {
    const arena = await findActiveArenaBySlug(slug);

    const court = await prisma.court.findFirst({
      where: { id: courtId, arenaId: arena.id, active: true },
      select: { id: true, name: true, hourlyRate: true, extraBlockMinutes: true, extraBlockPrice: true },
    });
    if (!court) throw new NotFoundError('Quadra');

    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000);

    const rachas = await prisma.racha.findMany({
      where: { courtId: court.id, date: { gte: dayStart, lt: dayEnd } },
      select: { date: true, durationMinutes: true },
      orderBy: { date: 'asc' },
    });

    return {
      arena: { id: arena.id, name: arena.name, slug: arena.slug },
      court,
      openTime: arena.bookingOpenTime,
      closeTime: arena.bookingCloseTime,
      busy: rachas.map((racha) => ({
        startsAt: racha.date.toISOString(),
        endsAt: endOfRacha(racha).toISOString(),
      })),
    };
  },

  async createBooking(slug: string, input: CreateBookingInput) {
    const arena = await findActiveArenaBySlug(slug);

    const court = await prisma.court.findFirst({
      where: { id: input.courtId, arenaId: arena.id, active: true },
    });
    if (!court) throw new NotFoundError('Quadra');

    const startsAt = input.startsAt;
    const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60_000);

    if (startsAt.getTime() < Date.now()) {
      throw new AppError('Não é possível agendar um horário no passado', 400, 'BOOKING_IN_PAST');
    }

    // A reserva precisa caber inteira na janela de funcionamento do mesmo dia.
    const startMinutes = minutesSinceMidnight(startsAt);
    const endMinutes = startMinutes + input.durationMinutes;
    const openMinutes = timeToMinutes(arena.bookingOpenTime);
    const closeMinutes = timeToMinutes(arena.bookingCloseTime);

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      throw new AppError(
        `A arena funciona das ${arena.bookingOpenTime} às ${arena.bookingCloseTime}`,
        400,
        'OUTSIDE_BUSINESS_HOURS',
      );
    }

    // O preço nunca vem do cliente: é sempre recalculado a partir da quadra.
    const courtPrice = calculateCourtPrice(input.durationMinutes, court);

    try {
      return await prisma.$transaction(
        async (tx) => {
          // Serializa reservas concorrentes da mesma quadra: sem isso, duas
          // pessoas podem passar pela checagem de conflito ao mesmo tempo e
          // ambas conseguirem reservar o mesmo horário.
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${court.id}))`;

          const dayStart = new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate());
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60_000);

          const sameDay = await tx.racha.findMany({
            where: { courtId: court.id, date: { gte: dayStart, lt: dayEnd } },
            select: { date: true, durationMinutes: true },
          });

          const overlaps = sameDay.some(
            (racha) => racha.date.getTime() < endsAt.getTime() && endOfRacha(racha).getTime() > startsAt.getTime(),
          );
          if (overlaps) {
            throw new ConflictError('Esse horário acabou de ser reservado. Escolha outro.');
          }

          return tx.racha.create({
            data: {
              arenaId: arena.id,
              courtId: court.id,
              date: startsAt,
              durationMinutes: input.durationMinutes,
              courtPrice,
              numberOfPlayers: null,
              status: 'ABERTO',
              source: 'PUBLIC_BOOKING',
              bookedByName: input.playerName,
              bookedByPhone: input.playerPhone,
            },
            select: { id: true, date: true, durationMinutes: true, courtPrice: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );
    } finally {
      logger.info('public_booking_attempt', {
        arenaId: arena.id,
        courtId: court.id,
        startsAt: startsAt.toISOString(),
        durationMinutes: input.durationMinutes,
      });
    }
  },
};
