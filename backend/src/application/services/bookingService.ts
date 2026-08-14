import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError, ConflictError, NotFoundError } from "../../domain/errors";
import { addMinutes, overlaps } from "../../domain/time";
import { decryptQuadraAccessToken } from "./quadraSettingsService";
import { mercadoPagoClient } from "../../infrastructure/mercadoPago/mercadoPagoClient";
import { env } from "../../config/env";
import { notificationService } from "./notificationService";

const CANCEL_MIN_HOURS_BEFORE = 24;
const DEPOSIT_RATE = 0.2;
const PAYMENT_HOLD_MINUTES = 20;

interface CreateBookingInput {
  date: string;
  startTime: string;
  withExtraBlock?: boolean;
  customerName: string;
  customerPhone: string;
  paymentMode?: "DEPOSITO" | "INTEGRAL";
}

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["CONFIRMADA", "PENDENTE_PAGAMENTO"];

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

function isHoldExpired(booking: { status: string; holdExpiresAt: Date | null }) {
  return booking.status === "PENDENTE_PAGAMENTO" && !!booking.holdExpiresAt && booking.holdExpiresAt < new Date();
}

async function expireStaleHolds(courtId: string, dateValue?: Date) {
  await prisma.booking.updateMany({
    where: {
      courtId,
      ...(dateValue ? { date: dateValue } : {}),
      status: "PENDENTE_PAGAMENTO",
      holdExpiresAt: { lt: new Date() },
    },
    data: { status: "CANCELADA" },
  });
}

function payerEmailFor(bookingId: string) {
  return `reserva-${bookingId}@gestquadra.app`;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function formatDateBR(date: Date) {
  return date.toISOString().slice(0, 10).split("-").reverse().join("/");
}

async function notifyBookingConfirmed(
  quadra: Parameters<typeof notificationService.sendBookingConfirmation>[0] &
    Parameters<typeof notificationService.sendNewAvulsaBookingAlert>[0],
  booking: { customerName: string; customerPhone: string; date: Date; startTime: string },
  courtName: string,
) {
  const payload = {
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    date: formatDateBR(booking.date),
    startTime: booking.startTime,
  };
  await notificationService.sendBookingConfirmation(quadra, payload, courtName);
  await notificationService.sendNewAvulsaBookingAlert(quadra, payload, courtName);
}

export const bookingService = {
  async listCourts(quadraSlug: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const courts = await prisma.court.findMany({
      where: { quadraId: quadra.id, active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        hourlyRate: true,
        slotMinutes: true,
        extraBlockMinutes: true,
        extraBlockPrice: true,
        mensalistaHourlyRate: true,
      },
    });
    return {
      arenaName: quadra.name,
      courts,
      pixEnabled: Boolean(quadra.mercadoPagoAccessToken),
      allowDepositPayment: quadra.allowDepositPayment,
      allowFullPayment: quadra.allowFullPayment,
    };
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

    await expireStaleHolds(courtId, dateValue);

    const [partialBlocks, bookings] = await Promise.all([
      prisma.courtBlock.findMany({ where: { courtId, date: dateValue, startTime: { not: null } } }),
      prisma.booking.findMany({ where: { courtId, date: dateValue, status: { in: ACTIVE_BOOKING_STATUSES } } }),
    ]);

    const slots: { startTime: string; endTime: string; available: boolean }[] = [];
    let cursor = hours.openTime;
    while (cursor < hours.closeTime) {
      const end = addMinutes(cursor, court.slotMinutes);
      if (end > hours.closeTime) break;

      const blocked = partialBlocks.some((b) => overlaps(cursor, end, b.startTime!, b.endTime!));
      const booked = bookings.some((b) => overlaps(cursor, end, b.startTime, b.endTime));
      slots.push({ startTime: cursor, endTime: end, available: !blocked && !booked });
      cursor = end;
    }

    return {
      open: true,
      hourlyRate: court.hourlyRate,
      slotMinutes: court.slotMinutes,
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
    const duration = court.slotMinutes + (withExtraBlock ? court.extraBlockMinutes : 0);
    const endTime = addMinutes(input.startTime, duration);

    if (input.startTime < hours.openTime || endTime <= input.startTime || endTime > hours.closeTime) {
      throw new AppError("Fora do horário de funcionamento da quadra");
    }

    const totalPrice = Number(court.hourlyRate) + (withExtraBlock ? Number(court.extraBlockPrice ?? 0) : 0);
    const dateValue = new Date(input.date);

    await expireStaleHolds(courtId, dateValue);

    const pixEnabled = Boolean(quadra.mercadoPagoAccessToken);

    let paymentMode: "DEPOSITO" | "INTEGRAL" | null = null;
    if (pixEnabled) {
      const requested = input.paymentMode ?? (quadra.allowDepositPayment ? "DEPOSITO" : "INTEGRAL");
      if (requested === "DEPOSITO" && !quadra.allowDepositPayment) {
        throw new AppError("Essa arena não aceita pagamento de sinal");
      }
      if (requested === "INTEGRAL" && !quadra.allowFullPayment) {
        throw new AppError("Essa arena não aceita pagamento do valor integral");
      }
      paymentMode = requested;
    }

    const depositAmount = pixEnabled
      ? paymentMode === "INTEGRAL"
        ? totalPrice
        : Math.round(totalPrice * DEPOSIT_RATE * 100) / 100
      : null;
    const holdExpiresAt = pixEnabled ? new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60 * 1000) : null;

    let booking;
    try {
      booking = await prisma.$transaction(
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
            where: { courtId, date: dateValue, status: { in: ACTIVE_BOOKING_STATUSES } },
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
              status: pixEnabled ? "PENDENTE_PAGAMENTO" : "CONFIRMADA",
              depositAmount,
              paymentMode,
              holdExpiresAt,
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

    if (!pixEnabled) {
      await notifyBookingConfirmed(quadra, booking, court.name);
      return { ...booking, pix: null };
    }

    try {
      const accessToken = decryptQuadraAccessToken(quadra.mercadoPagoAccessToken!);
      const payment = await mercadoPagoClient.createPixPayment({
        accessToken,
        amount: depositAmount!,
        description: `${paymentMode === "INTEGRAL" ? "Pagamento integral" : "Sinal"} da reserva ${court.name} - ${input.date} ${input.startTime}`,
        externalReference: booking.id,
        payerEmail: payerEmailFor(booking.id),
        notificationUrl: env.publicBaseUrl ? `${env.publicBaseUrl}/api/booking/${quadraSlug}/pix-webhook` : undefined,
      });

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: { pixPaymentId: payment.id },
      });

      return {
        ...updated,
        pix: { qrCode: payment.qrCode, qrCodeBase64: payment.qrCodeBase64 },
      };
    } catch (err) {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELADA" } });
      throw err;
    }
  },

  async getPaymentStatus(quadraSlug: string, bookingId: string, token: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const booking = await findBookingByToken(quadraSlug, bookingId, token);

    if (isHoldExpired(booking)) {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELADA" } });
      return { status: "CANCELADA", expired: true };
    }

    if (booking.status !== "PENDENTE_PAGAMENTO" || !booking.pixPaymentId || !quadra.mercadoPagoAccessToken) {
      return { status: booking.status, expired: false };
    }

    const accessToken = decryptQuadraAccessToken(quadra.mercadoPagoAccessToken);
    const payment = await mercadoPagoClient.getPayment(accessToken, booking.pixPaymentId);

    if (payment.status === "approved") {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMADA" } });
      await notifyBookingConfirmed(quadra, booking, booking.court.name);
      return { status: "CONFIRMADA", expired: false };
    }

    if (payment.status === "cancelled" || payment.status === "rejected") {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELADA" } });
      return { status: "CANCELADA", expired: false };
    }

    return { status: "PENDENTE_PAGAMENTO", expired: false };
  },

  async handlePixWebhook(quadraSlug: string, paymentId: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    if (!quadra.mercadoPagoAccessToken) return false;

    const booking = await prisma.booking.findFirst({
      where: { pixPaymentId: paymentId, court: { quadraId: quadra.id } },
      include: { court: { select: { name: true } } },
    });
    if (!booking || booking.status !== "PENDENTE_PAGAMENTO") return false;

    const accessToken = decryptQuadraAccessToken(quadra.mercadoPagoAccessToken);
    const payment = await mercadoPagoClient.getPayment(accessToken, paymentId);

    if (payment.status === "approved") {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMADA" } });
      await notifyBookingConfirmed(quadra, booking, booking.court.name);
    } else if (payment.status === "cancelled" || payment.status === "rejected") {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELADA" } });
    }
    return true;
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

    if (booking.status === "CONFIRMADA" && hoursUntilStart(booking) < CANCEL_MIN_HOURS_BEFORE) {
      throw new AppError(
        `O cancelamento só pode ser feito até ${CANCEL_MIN_HOURS_BEFORE}h antes do horário reservado`,
      );
    }

    return prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELADA" } });
  },

  async findByPhone(quadraSlug: string, phone: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const normalized = normalizePhone(phone);
    if (!normalized) {
      throw new AppError("Informe um telefone válido");
    }

    const bookings = await prisma.booking.findMany({
      where: { court: { quadraId: quadra.id } },
      include: { court: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });

    const matches = bookings.filter((b) => normalizePhone(b.customerPhone) === normalized);

    return matches.map((booking) => ({
      ...booking,
      cancellable: booking.status === "CONFIRMADA" && hoursUntilStart(booking) >= CANCEL_MIN_HOURS_BEFORE,
      cancelMinHoursBefore: CANCEL_MIN_HOURS_BEFORE,
    }));
  },

  async cancelByPhone(quadraSlug: string, bookingId: string, phone: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const normalized = normalizePhone(phone);

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, court: { quadraId: quadra.id } },
    });
    if (!booking || normalizePhone(booking.customerPhone) !== normalized) {
      throw new NotFoundError("Reserva não encontrada");
    }

    if (booking.status === "CANCELADA") {
      throw new AppError("Essa reserva já está cancelada");
    }

    if (booking.status === "CONFIRMADA" && hoursUntilStart(booking) < CANCEL_MIN_HOURS_BEFORE) {
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
    await expireStaleHolds(courtId);
    return prisma.booking.findMany({
      where: {
        courtId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        date: { gte: new Date(new Date().toISOString().slice(0, 10)) },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  },

  async listAllForQuadra(
    quadraId: string,
    filters: { courtId?: string; status?: BookingStatus; dateFrom?: string; dateTo?: string },
  ) {
    await prisma.booking.updateMany({
      where: {
        court: { quadraId },
        status: "PENDENTE_PAGAMENTO",
        holdExpiresAt: { lt: new Date() },
      },
      data: { status: "CANCELADA" },
    });

    return prisma.booking.findMany({
      where: {
        court: { quadraId },
        ...(filters.courtId ? { courtId: filters.courtId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              date: {
                ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
                ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
              },
            }
          : {}),
      },
      include: { court: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
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
