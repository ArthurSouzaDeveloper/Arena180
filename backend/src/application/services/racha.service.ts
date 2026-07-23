import { Prisma, RachaStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, AppError } from '../../utils/errors';

interface RachaItemInput {
  productId: string;
  quantity: number;
}

interface CreateRachaInput {
  date?: Date;
  courtPrice: number;
  numberOfPlayers: number;
  notes?: string;
  items: RachaItemInput[];
}

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

/** Monta o resumo financeiro de uma racha: total da quadra + consumo, dividido pelos jogadores. */
function summarize(racha: {
  courtPrice: Prisma.Decimal;
  numberOfPlayers: number;
  items: { quantity: number; unitPrice: Prisma.Decimal; product: { name: string } }[];
}) {
  const courtPrice = toNumber(racha.courtPrice);
  const consumptionTotal = racha.items.reduce((sum, item) => sum + item.quantity * toNumber(item.unitPrice), 0);
  const total = courtPrice + consumptionTotal;
  const perPlayer = total / racha.numberOfPlayers;

  return {
    courtPrice,
    consumptionTotal,
    total,
    perPlayer: Math.round(perPlayer * 100) / 100,
    items: racha.items.map((item) => ({
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      subtotal: Math.round(item.quantity * toNumber(item.unitPrice) * 100) / 100,
    })),
  };
}

export const rachaService = {
  async create(quadraId: string, input: CreateRachaInput) {
    if (input.items.length > 0) {
      const productIds = input.items.map((item) => item.productId);
      const products = await prisma.product.findMany({ where: { id: { in: productIds }, quadraId } });
      if (products.length !== new Set(productIds).size) {
        throw new AppError('Um ou mais produtos não pertencem a esta quadra', 400, 'INVALID_PRODUCT');
      }

      const priceByProduct = new Map(products.map((p) => [p.id, p.price]));

      const racha = await prisma.racha.create({
        data: {
          quadraId,
          date: input.date ?? new Date(),
          courtPrice: input.courtPrice,
          numberOfPlayers: input.numberOfPlayers,
          notes: input.notes,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: priceByProduct.get(item.productId)!,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });
      return { ...racha, summary: summarize(racha) };
    }

    const racha = await prisma.racha.create({
      data: {
        quadraId,
        date: input.date ?? new Date(),
        courtPrice: input.courtPrice,
        numberOfPlayers: input.numberOfPlayers,
        notes: input.notes,
      },
      include: { items: { include: { product: true } } },
    });
    return { ...racha, summary: summarize(racha) };
  },

  async get(quadraId: string, rachaId: string) {
    const racha = await prisma.racha.findFirst({
      where: { id: rachaId, quadraId },
      include: { items: { include: { product: true } } },
    });
    if (!racha) throw new NotFoundError('Racha');
    return { ...racha, summary: summarize(racha) };
  },

  async list(quadraId: string, from?: Date, to?: Date) {
    const rachas = await prisma.racha.findMany({
      where: {
        quadraId,
        ...(from || to ? { date: { gte: from, lte: to } } : {}),
      },
      include: { items: { include: { product: true } } },
      orderBy: { date: 'desc' },
    });
    return rachas.map((racha) => ({ ...racha, summary: summarize(racha) }));
  },

  async setStatus(quadraId: string, rachaId: string, status: RachaStatus) {
    const existing = await prisma.racha.findFirst({ where: { id: rachaId, quadraId } });
    if (!existing) throw new NotFoundError('Racha');
    return prisma.racha.update({ where: { id: rachaId }, data: { status } });
  },
};
