import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError, ConflictError, NotFoundError } from "../../domain/errors";
import { addMinutes, overlaps } from "../../domain/time";

const SLOT_MINUTES = 60;
const CANCEL_MIN_HOURS_BEFORE = 24;

interface CreateBookingInput {
  date: string;
  startTime: string;
  withExtraBlock?: boolean;
  customerName: string;
  customerPhone: string;
}

async function findQuadraBySlug(slug: string) {
  const quadra = await prisma.quadra.findUnique({ where: { slug } });
  if (!quadra || !quadra.active) {
    throw new NotFoundError("Estabelecimento não encontrado");
  }
  return quadra;
}

async function findActiveCourt(quadraId: string, courtId: string) {
  const court = await prisma.court.findFirst({ where: { id: courtId, quadraId, active: true } });
  if (!court) {
    throw new NotFoundError("Quadra não encontrada");
  }
  return court;
}

function weekdayOf(date: string) {
  return new Date(`${date}T00:00:00`).getDay();
}

async function findBookingByToken(quadraSlug: string, bookingId: string, token: string) {
  const quadra = await findQuadraBySlug(quadraSlug);
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, cancelToken: token, court: { quadraId: quadra.id } },
    include: { court: { select: { name: true } } },
  });
  if (!booking) {
    throw new NotFoundError("Reserva não encontrada");
  }
  return booking;
}

function hoursUntilStart(booking: { date: Date; startTime: string }) {
  const startsAt = new Date(`${booking.date.toISOString().slice(0, 10)}T${booking.startTime}:00`);
  return (startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
}

export const bookingService = {
  async listCourts(quadraSlug: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    return prisma.court.findMany({
      where: { quadraId: quadra.id, active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        hourlyRate: true,
        extraBlockMinutes: true,
        extraBlockPrice: true,
      },
    });
  },

  async availability(quadraSlug: string, courtId: string, date: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const court = await findActiveCourt(quadra.id, courtId);

    const weekday = weekdayOf(date);
    const hours = await prisma.courtHours.findUnique({
      where: { courtId_weekday: { courtId, weekday } },
    });

    if (!hours || hours.closed) {
      return { open: false, slots: [] as { startTime: string; endTime: string; available: boolean }[] };
    }

    const dateValue = new Date(date);

    const fullDayBlock = await prisma.courtBlock.findFirst({
      where: { courtId, date: dateValue, startTime: null },
    });
    if (fullDayBlock) {
      return { open: false, slots: [], reason: fullDayBlock.reason ?? undefined };
    }

    const [partialBlocks, bookings] = await Promise.all([
      prisma.courtBlock.findMany({ where: { courtId, date: dateValue, startTime: { not: null } } }),
      prisma.booking.findMany({ where: { courtId, date: dateValue, status: "CONFIRMADA" } }),
    ]);

    const slots: { startTime: string; endTime: string; available: boolean }[] = [];
    let cursor = hours.openTime;
    while (cursor < hours.closeTime) {
      const end = addMinutes(cursor, SLOT_MINUTES);
      if (end > hours.closeTime) break;

      const blocked = partialBlocks.some((b) => overlaps(cursor, end, b.startTime!, b.endTime!));
      const booked = bookings.some((b) => overlaps(cursor, end, b.startTime, b.endTime));
      slots.push({ startTime: cursor, endTime: end, available: !blocked && !booked });
      cursor = end;
    }

    return {
      open: true,
      hourlyRate: court.hourlyRate,
      extraBlockMinutes: court.extraBlockMinutes,
      extraBlockPrice: court.extraBlockPrice,
      slots,
    };
  },

  async create(quadraSlug: string, courtId: string, input: CreateBookingInput) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const court = await findActiveCourt(quadra.id, courtId);

    const weekday = weekdayOf(input.date);
    const hours = await prisma.courtHours.findUnique({
      where: { courtId_weekday: { courtId, weekday } },
    });
    if (!hours || hours.closed) {
      throw new AppError("Quadra fechada nesse dia");
    }

    const withExtraBlock = Boolean(input.withExtraBlock && court.extraBlockMinutes > 0);
    const duration = SLOT_MINUTES + (withExtraBlock ? court.extraBlockMinutes : 0);
    const endTime = addMinutes(input.startTime, duration);

    if (input.startTime < hours.openTime || endTime <= input.startTime || endTime > hours.closeTime) {
      throw new AppError("Fora do horário de funcionamento da quadra");
    }

    const totalPrice = Number(court.hourlyRate) + (withExtraBlock ? Number(court.extraBlockPrice ?? 0) : 0);
    const dateValue = new Date(input.date);

    try {
      return await prisma.$transaction(
        async (tx) => {
          const fullDayBlock = await tx.courtBlock.findFirst({
            where: { courtId, date: dateValue, startTime: null },
          });
          if (fullDayBlock) {
            throw new AppError("Quadra indisponível nessa data");
          }

          const partialBlocks = await tx.courtBlock.findMany({
            where: { courtId, date: dateValue, startTime: { not: null } },
          });
          const blockConflict = partialBlocks.some((b) => overlaps(input.startTime, endTime, b.startTime!, b.endTime!));
          if (blockConflict) {
            throw new AppError("Horário indisponível");
          }

          const existing = await tx.booking.findMany({
            where: { courtId, date: dateValue, status: "CONFIRMADA" },
          });
          const conflict = existing.some((b) => overlaps(input.startTime, endTime, b.startTime, b.endTime));
          if (conflict) {
            throw new ConflictError("Esse horário acabou de ser reservado. Escolha outro.");
          }

          return tx.booking.create({
            data: {
              courtId,
              date: dateValue,
              startTime: input.startTime,
              endTime,
              customerName: input.customerName,
              customerPhone: input.customerPhone,
              totalPrice,
              status: "CONFIRMADA",
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
        throw new ConflictError("Esse horário acabou de ser reservado. Escolha outro.");
      }
      throw err;
    }
  },

  async getByToken(quadraSlug: string, bookingId: string, token: string) {
    const booking = await findBookingByToken(quadraSlug, bookingId, token);
    const cancellable = booking.status === "CONFIRMADA" && hoursUntilStart(booking) >= CANCEL_MIN_HOURS_BEFORE;
    return { ...booking, cancellable, cancelMinHoursBefore: CANCEL_MIN_HOURS_BEFORE };
  },

  async cancelByToken(quadraSlug: string, bookingId: string, token: string) {
    const booking = await findBookingByToken(quadraSlug, bookingId, token);

    if (booking.status === "CANCELADA") {
      throw new AppError("Essa reserva já está cancelada");
    }

    if (hoursUntilStart(booking) < CANCEL_MIN_HOURS_BEFORE) {
      throw new AppError(
        `O cancelamento só pode ser feito até ${CANCEL_MIN_HOURS_BEFORE}h antes do horário reservado`,
      );
    }

    return prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELADA" } });
  },

  async listForCourt(quadraId: string, courtId: string) {
    const court = await prisma.court.findFirst({ where: { id: courtId, quadraId } });
    if (!court) {
      throw new NotFoundError("Quadra não encontrada");
    }
    return prisma.booking.findMany({
      where: { courtId, status: "CONFIRMADA", date: { gte: new Date(new Date().toISOString().slice(0, 10)) } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  },

  async adminCancel(quadraId: string, courtId: string, bookingId: string) {
    const court = await prisma.court.findFirst({ where: { id: courtId, quadraId } });
    if (!court) {
      throw new NotFoundError("Quadra não encontrada");
    }
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, courtId } });
    if (!booking) {
      throw new NotFoundError("Reserva não encontrada");
    }
    return prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELADA" } });
  },
};
