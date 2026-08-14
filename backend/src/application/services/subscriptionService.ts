import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError, ConflictError, NotFoundError } from "../../domain/errors";
import { addMinutes, overlaps, toBrazilDateTime } from "../../domain/time";
import { decryptQuadraAccessToken } from "./quadraSettingsService";
import { mercadoPagoClient } from "../../infrastructure/mercadoPago/mercadoPagoClient";
import { env } from "../../config/env";
import { notificationService } from "./notificationService";

const CYCLE_DAYS = 30;
const DEPOSIT_RATE = 0.2;
const PAYMENT_HOLD_MINUTES = 20;
const EXTEND_HORIZON_DAYS = 60;
const RENEWAL_NOTICE_DAYS = 28;

const WEEKDAY_LABELS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

const ACTIVE_BOOKING_STATUSES = ["CONFIRMADA", "PENDENTE_PAGAMENTO"] as const;

interface CreateSubscriptionInput {
  weekday: number;
  startTime: string;
  customerName: string;
  customerPhone: string;
}

function todayBrazil(): Date {
  const brazilNow = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return new Date(brazilNow.toISOString().slice(0, 10));
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function dateToIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function occurrenceDatesInWindow(weekday: number, from: Date, windowDays: number) {
  const dates: Date[] = [];
  for (let i = 0; i < windowDays; i++) {
    const candidate = addDays(from, i);
    if (candidate.getUTCDay() === weekday) dates.push(candidate);
  }
  return dates;
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
  if (!court.mensalistaHourlyRate) {
    throw new AppError("Essa quadra não oferece assinatura mensalista");
  }
  return court;
}

function payerEmailFor(subscriptionId: string) {
  return `mensalista-${subscriptionId}@arena180.app`;
}

async function computeQuote(courtId: string, weekday: number, startTime: string) {
  const court = await prisma.court.findUnique({ where: { id: courtId } });
  if (!court || !court.mensalistaHourlyRate) {
    throw new AppError("Essa quadra não oferece assinatura mensalista");
  }

  const hours = await prisma.courtHours.findUnique({ where: { courtId_weekday: { courtId, weekday } } });
  if (!hours || hours.closed) {
    throw new AppError("Quadra fechada nesse dia da semana");
  }

  const endTime = addMinutes(startTime, court.slotMinutes);
  if (startTime < hours.openTime || endTime <= startTime || endTime > hours.closeTime) {
    throw new AppError("Fora do horário de funcionamento da quadra");
  }

  const today = todayBrazil();
  const now = new Date();
  let dates = occurrenceDatesInWindow(weekday, today, CYCLE_DAYS);
  dates = dates.filter((d) => {
    if (dateToIso(d) !== dateToIso(today)) return true;
    const startsAt = toBrazilDateTime(dateToIso(d), startTime);
    return startsAt > now;
  });

  if (dates.length === 0) {
    throw new AppError("Não há ocorrências futuras para esse dia da semana");
  }

  const fullDayBlocks = await prisma.courtBlock.findMany({
    where: { courtId, date: { in: dates }, startTime: null },
  });
  const partialBlocks = await prisma.courtBlock.findMany({
    where: { courtId, date: { in: dates }, startTime: { not: null } },
  });
  const existingBookings = await prisma.booking.findMany({
    where: { courtId, date: { in: dates }, status: { in: [...ACTIVE_BOOKING_STATUSES] } },
  });

  for (const date of dates) {
    const iso = dateToIso(date);
    if (fullDayBlocks.some((b) => dateToIso(b.date) === iso)) {
      throw new AppError(`A quadra está indisponível em ${iso.split("-").reverse().join("/")}`);
    }
    const blockConflict = partialBlocks.some(
      (b) => dateToIso(b.date) === iso && overlaps(startTime, endTime, b.startTime!, b.endTime!),
    );
    if (blockConflict) {
      throw new AppError(`Horário indisponível em ${iso.split("-").reverse().join("/")}`);
    }
    const bookingConflict = existingBookings.some(
      (b) => dateToIso(b.date) === iso && overlaps(startTime, endTime, b.startTime, b.endTime),
    );
    if (bookingConflict) {
      throw new AppError(`Horário já reservado em ${iso.split("-").reverse().join("/")}`);
    }
  }

  const pricePerOccurrence = Number(court.mensalistaHourlyRate);
  const totalPrice = Math.round(pricePerOccurrence * dates.length * 100) / 100;
  const depositAmount = Math.round(totalPrice * DEPOSIT_RATE * 100) / 100;

  return { court, hours, endTime, dates, pricePerOccurrence, totalPrice, depositAmount };
}

export const subscriptionService = {
  async quote(quadraSlug: string, courtId: string, weekday: number, startTime: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    await findActiveCourt(quadra.id, courtId);
    const { dates, endTime, pricePerOccurrence, totalPrice, depositAmount } = await computeQuote(
      courtId,
      weekday,
      startTime,
    );
    return {
      dates: dates.map(dateToIso),
      endTime,
      pricePerOccurrence,
      totalPrice,
      depositAmount,
    };
  },

  async hoursForWeekday(quadraSlug: string, courtId: string, weekday: number) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const court = await findActiveCourt(quadra.id, courtId);
    const hours = await prisma.courtHours.findUnique({ where: { courtId_weekday: { courtId, weekday } } });
    if (!hours || hours.closed) {
      return { open: false as const };
    }
    return {
      open: true as const,
      openTime: hours.openTime,
      closeTime: hours.closeTime,
      slotMinutes: court.slotMinutes,
      pricePerOccurrence: Number(court.mensalistaHourlyRate),
    };
  },

  async create(quadraSlug: string, courtId: string, input: CreateSubscriptionInput) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const court = await findActiveCourt(quadra.id, courtId);

    const { dates, endTime, pricePerOccurrence, totalPrice, depositAmount } = await computeQuote(
      courtId,
      input.weekday,
      input.startTime,
    );

    const pixEnabled = Boolean(quadra.mercadoPagoAccessToken);
    const holdExpiresAt = pixEnabled ? new Date(Date.now() + PAYMENT_HOLD_MINUTES * 60 * 1000) : null;

    let subscription;
    try {
      subscription = await prisma.$transaction(
        async (tx) => {
          for (const date of dates) {
            const fullDayBlock = await tx.courtBlock.findFirst({ where: { courtId, date, startTime: null } });
            if (fullDayBlock) {
              throw new AppError("Quadra indisponível em uma das datas do ciclo");
            }
            const partialBlocks = await tx.courtBlock.findMany({
              where: { courtId, date, startTime: { not: null } },
            });
            const blockConflict = partialBlocks.some((b) =>
              overlaps(input.startTime, endTime, b.startTime!, b.endTime!),
            );
            if (blockConflict) {
              throw new AppError("Horário indisponível em uma das datas do ciclo");
            }
            const existing = await tx.booking.findMany({
              where: { courtId, date, status: { in: [...ACTIVE_BOOKING_STATUSES] } },
            });
            const conflict = existing.some((b) => overlaps(input.startTime, endTime, b.startTime, b.endTime));
            if (conflict) {
              throw new ConflictError("Um dos horários do ciclo acabou de ser reservado. Tente novamente.");
            }
          }

          const created = await tx.subscription.create({
            data: {
              courtId,
              customerName: input.customerName,
              customerPhone: input.customerPhone,
              weekday: input.weekday,
              startTime: input.startTime,
              endTime,
              pricePerOccurrence,
              depositAmount,
              status: pixEnabled ? "AGUARDANDO_PAGAMENTO" : "ATIVA",
              holdExpiresAt,
              cycleStartDate: dates[0],
            },
          });

          await tx.booking.createMany({
            data: dates.map((date) => ({
              courtId,
              date,
              startTime: input.startTime,
              endTime,
              customerName: input.customerName,
              customerPhone: input.customerPhone,
              totalPrice: pricePerOccurrence,
              status: pixEnabled ? "PENDENTE_PAGAMENTO" : "CONFIRMADA",
              holdExpiresAt,
              subscriptionId: created.id,
            })),
          });

          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034") {
        throw new ConflictError("Um dos horários do ciclo acabou de ser reservado. Tente novamente.");
      }
      throw err;
    }

    if (!pixEnabled) {
      await notificationService.sendBookingConfirmation(
        quadra,
        {
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          date: dateToIso(dates[0]).split("-").reverse().join("/"),
          startTime: input.startTime,
        },
        court.name,
      );
      return { ...subscription, pix: null, dates: dates.map(dateToIso), totalPrice };
    }

    try {
      const accessToken = decryptQuadraAccessToken(quadra.mercadoPagoAccessToken!);
      const payment = await mercadoPagoClient.createPixPayment({
        accessToken,
        amount: depositAmount,
        description: `Sinal mensalista ${court.name} - ${WEEKDAY_LABELS[input.weekday]} ${input.startTime}`,
        externalReference: subscription.id,
        payerEmail: payerEmailFor(subscription.id),
        notificationUrl: env.publicBaseUrl ? `${env.publicBaseUrl}/api/booking/${quadraSlug}/pix-webhook` : undefined,
      });

      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { pixPaymentId: payment.id },
      });

      return {
        ...updated,
        pix: { qrCode: payment.qrCode, qrCodeBase64: payment.qrCodeBase64 },
        dates: dates.map(dateToIso),
        totalPrice,
      };
    } catch (err) {
      await prisma.$transaction([
        prisma.booking.updateMany({ where: { subscriptionId: subscription.id }, data: { status: "CANCELADA" } }),
        prisma.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELADA" } }),
      ]);
      throw err;
    }
  },

  async confirmPayment(subscription: { id: string; customerName: string; customerPhone: string }, courtName: string, quadra: Parameters<typeof notificationService.sendBookingConfirmation>[0]) {
    const updated = await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ATIVA" } });
    await prisma.booking.updateMany({
      where: { subscriptionId: subscription.id, status: "PENDENTE_PAGAMENTO" },
      data: { status: "CONFIRMADA" },
    });
    const firstBooking = await prisma.booking.findFirst({
      where: { subscriptionId: subscription.id },
      orderBy: { date: "asc" },
    });
    if (firstBooking) {
      await notificationService.sendBookingConfirmation(
        quadra,
        {
          customerName: subscription.customerName,
          customerPhone: subscription.customerPhone,
          date: dateToIso(firstBooking.date).split("-").reverse().join("/"),
          startTime: firstBooking.startTime,
        },
        courtName,
      );
    }
    return updated;
  },

  async cancelPayment(subscriptionId: string) {
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { subscriptionId, status: "PENDENTE_PAGAMENTO" },
        data: { status: "CANCELADA" },
      }),
      prisma.subscription.update({ where: { id: subscriptionId }, data: { status: "CANCELADA" } }),
    ]);
  },

  async getPaymentStatus(quadraSlug: string, subscriptionId: string, token: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, cancelToken: token, court: { quadraId: quadra.id } },
      include: { court: { select: { name: true } } },
    });
    if (!subscription) {
      throw new NotFoundError("Assinatura não encontrada");
    }

    if (subscription.status === "AGUARDANDO_PAGAMENTO" && subscription.holdExpiresAt && subscription.holdExpiresAt < new Date()) {
      await this.cancelPayment(subscription.id);
      return { status: "CANCELADA", expired: true };
    }

    if (subscription.status !== "AGUARDANDO_PAGAMENTO" || !subscription.pixPaymentId || !quadra.mercadoPagoAccessToken) {
      return { status: subscription.status, expired: false };
    }

    const accessToken = decryptQuadraAccessToken(quadra.mercadoPagoAccessToken);
    const payment = await mercadoPagoClient.getPayment(accessToken, subscription.pixPaymentId);

    if (payment.status === "approved") {
      await this.confirmPayment(subscription, subscription.court.name, quadra);
      return { status: "ATIVA", expired: false };
    }
    if (payment.status === "cancelled" || payment.status === "rejected") {
      await this.cancelPayment(subscription.id);
      return { status: "CANCELADA", expired: false };
    }
    return { status: "AGUARDANDO_PAGAMENTO", expired: false };
  },

  async handlePixWebhook(quadraSlug: string, paymentId: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    if (!quadra.mercadoPagoAccessToken) return false;

    const subscription = await prisma.subscription.findFirst({
      where: { pixPaymentId: paymentId, court: { quadraId: quadra.id } },
      include: { court: { select: { name: true } } },
    });
    if (!subscription || subscription.status !== "AGUARDANDO_PAGAMENTO") return false;

    const accessToken = decryptQuadraAccessToken(quadra.mercadoPagoAccessToken);
    const payment = await mercadoPagoClient.getPayment(accessToken, paymentId);

    if (payment.status === "approved") {
      await this.confirmPayment(subscription, subscription.court.name, quadra);
    } else if (payment.status === "cancelled" || payment.status === "rejected") {
      await this.cancelPayment(subscription.id);
    }
    return true;
  },

  async getByToken(quadraSlug: string, subscriptionId: string, token: string) {
    const quadra = await findQuadraBySlug(quadraSlug);
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, cancelToken: token, court: { quadraId: quadra.id } },
      include: { court: { select: { name: true } } },
    });
    if (!subscription) {
      throw new NotFoundError("Assinatura não encontrada");
    }
    return subscription;
  },

  async cancelByToken(quadraSlug: string, subscriptionId: string, token: string) {
    const subscription = await this.getByToken(quadraSlug, subscriptionId, token);
    if (subscription.status === "CANCELADA") {
      throw new AppError("Essa assinatura já está cancelada");
    }
    return this.cancelSubscription(subscription.id);
  },

  async cancelSubscription(subscriptionId: string) {
    const today = todayBrazil();
    await prisma.$transaction([
      prisma.subscription.update({ where: { id: subscriptionId }, data: { status: "CANCELADA" } }),
      prisma.booking.updateMany({
        where: {
          subscriptionId,
          date: { gte: today },
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
        },
        data: { status: "CANCELADA" },
      }),
    ]);
    return prisma.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
  },

  async adminList(quadraId: string, courtId: string) {
    const court = await prisma.court.findFirst({ where: { id: courtId, quadraId } });
    if (!court) {
      throw new NotFoundError("Quadra não encontrada");
    }
    return prisma.subscription.findMany({
      where: { courtId, status: { in: ["ATIVA", "AGUARDANDO_PAGAMENTO"] } },
      orderBy: { createdAt: "desc" },
    });
  },

  async adminCancel(quadraId: string, courtId: string, subscriptionId: string) {
    const court = await prisma.court.findFirst({ where: { id: courtId, quadraId } });
    if (!court) {
      throw new NotFoundError("Quadra não encontrada");
    }
    const subscription = await prisma.subscription.findFirst({ where: { id: subscriptionId, courtId } });
    if (!subscription) {
      throw new NotFoundError("Assinatura não encontrada");
    }
    return this.cancelSubscription(subscriptionId);
  },

  async extendOccurrences() {
    const today = todayBrazil();
    const active = await prisma.subscription.findMany({ where: { status: "ATIVA" } });

    for (const sub of active) {
      const neededDates = occurrenceDatesInWindow(sub.weekday, today, EXTEND_HORIZON_DAYS);
      if (neededDates.length === 0) continue;

      const existing = await prisma.booking.findMany({
        where: { subscriptionId: sub.id, date: { in: neededDates } },
        select: { date: true },
      });
      const existingIso = new Set(existing.map((b) => dateToIso(b.date)));
      const missing = neededDates.filter((d) => !existingIso.has(dateToIso(d)));
      if (missing.length === 0) continue;

      for (const date of missing) {
        const conflict = await prisma.booking.findFirst({
          where: {
            courtId: sub.courtId,
            date,
            status: { in: [...ACTIVE_BOOKING_STATUSES] },
            OR: [
              { startTime: { lt: sub.endTime }, endTime: { gt: sub.startTime } },
            ],
          },
        });
        if (conflict) {
          console.error(`Conflito ao estender ocorrência do mensalista ${sub.id} em ${dateToIso(date)}`);
          continue;
        }
        await prisma.booking.create({
          data: {
            courtId: sub.courtId,
            date,
            startTime: sub.startTime,
            endTime: sub.endTime,
            customerName: sub.customerName,
            customerPhone: sub.customerPhone,
            totalPrice: sub.pricePerOccurrence,
            status: "CONFIRMADA",
            subscriptionId: sub.id,
          },
        });
      }
    }
  },

  async sendRenewalNotices() {
    const today = todayBrazil();
    const active = await prisma.subscription.findMany({
      where: { status: "ATIVA" },
      include: { court: { include: { quadra: true } } },
    });

    for (const sub of active) {
      const daysSinceStart = daysBetween(sub.cycleStartDate, today);
      const cycleIndex = Math.floor(daysSinceStart / CYCLE_DAYS);
      const currentCycleStart = addDays(sub.cycleStartDate, cycleIndex * CYCLE_DAYS);
      const daysIntoCycle = daysBetween(currentCycleStart, today);

      if (daysIntoCycle < RENEWAL_NOTICE_DAYS) continue;
      if (sub.lastRenewalNoticeCycleStart && dateToIso(sub.lastRenewalNoticeCycleStart) === dateToIso(currentCycleStart)) {
        continue;
      }

      await notificationService.sendMensalistaRenewalReminder(
        sub.court.quadra,
        {
          customerName: sub.customerName,
          customerPhone: sub.customerPhone,
          weekdayLabel: WEEKDAY_LABELS[sub.weekday],
          startTime: sub.startTime,
        },
        sub.court.name,
      );

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { lastRenewalNoticeCycleStart: currentCycleStart },
      });
    }
  },

  async expireStaleHolds() {
    const stale = await prisma.subscription.findMany({
      where: { status: "AGUARDANDO_PAGAMENTO", holdExpiresAt: { lt: new Date() } },
    });
    for (const sub of stale) {
      await this.cancelPayment(sub.id);
    }
  },
};
