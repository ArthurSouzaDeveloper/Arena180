import { Prisma, RachaStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, AppError } from '../../utils/errors';
import { courtService } from './court.service';

interface RachaItemInput {
  productId: string;
  quantity: number;
}

interface CreateRachaInput {
  courtId: string;
  date?: Date;
  durationMinutes?: number;
  courtPrice: number;
  numberOfPlayers?: number;
  notes?: string;
  items: RachaItemInput[];
}

interface ComandaInput {
  playerName: string;
  items: RachaItemInput[];
}

type RachaWithRelations = Prisma.RachaGetPayload<{
  include: {
    court: true;
    items: { include: { product: true } };
    comandas: { include: { items: { include: { product: true } } } };
  };
}>;

const rachaInclude = {
  court: true,
  items: { include: { product: true } },
  comandas: { include: { items: { include: { product: true } } } },
} satisfies Prisma.RachaInclude;

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Resumo financeiro: o valor da quadra + consumo compartilhado é rateado
 * igualmente entre todos os jogadores. Cada comanda cobra, além dessa parte
 * rateada, o consumo individual daquele jogador.
 */
function summarize(racha: RachaWithRelations) {
  const courtPrice = toNumber(racha.courtPrice);
  const consumptionTotal = racha.items.reduce((sum, item) => sum + item.quantity * toNumber(item.unitPrice), 0);
  const sharedTotal = courtPrice + consumptionTotal;
  // Enquanto o dono não informa quantos jogaram (caso do agendamento público),
  // não há como ratear — o valor por jogador fica zerado até o fechamento.
  const playersCount = racha.numberOfPlayers ?? 0;
  const perPlayer = playersCount > 0 ? round2(sharedTotal / playersCount) : 0;

  const comandas = racha.comandas.map((comanda) => {
    const comandaTotal = comanda.items.reduce((sum, item) => sum + item.quantity * toNumber(item.unitPrice), 0);
    return {
      id: comanda.id,
      playerName: comanda.playerName,
      items: comanda.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: toNumber(item.unitPrice),
        subtotal: round2(item.quantity * toNumber(item.unitPrice)),
      })),
      total: round2(comandaTotal),
      totalToPay: round2(perPlayer + comandaTotal),
    };
  });

  const comandasTotal = round2(comandas.reduce((sum, c) => sum + c.total, 0));
  const total = round2(sharedTotal + comandasTotal);

  return {
    courtPrice,
    consumptionTotal: round2(consumptionTotal),
    sharedTotal: round2(sharedTotal),
    perPlayer,
    comandasTotal,
    total,
    items: racha.items.map((item) => ({
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      subtotal: round2(item.quantity * toNumber(item.unitPrice)),
    })),
    comandas,
  };
}

async function findOwnedRacha(arenaId: string, rachaId: string) {
  const racha = await prisma.racha.findFirst({ where: { id: rachaId, arenaId } });
  if (!racha) throw new NotFoundError('Racha');
  return racha;
}

async function validateProductsBelongToArena(arenaId: string, items: RachaItemInput[]) {
  if (items.length === 0) return new Map<string, Prisma.Decimal>();
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, arenaId } });
  if (products.length !== new Set(productIds).size) {
    throw new AppError('Um ou mais produtos não pertencem a esta arena', 400, 'INVALID_PRODUCT');
  }
  return new Map(products.map((p) => [p.id, p.price]));
}

export const rachaService = {
  async create(arenaId: string, input: CreateRachaInput) {
    // A quadra precisa ser da própria arena — impede vincular uma racha à
    // quadra de outro cliente do SaaS passando um courtId qualquer.
    await courtService.getOwned(arenaId, input.courtId);
    const priceByProduct = await validateProductsBelongToArena(arenaId, input.items);

    const racha = await prisma.racha.create({
      data: {
        arenaId,
        courtId: input.courtId,
        date: input.date ?? new Date(),
        durationMinutes: input.durationMinutes ?? 60,
        courtPrice: input.courtPrice,
        numberOfPlayers: input.numberOfPlayers ?? null,
        notes: input.notes,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: priceByProduct.get(item.productId)!,
          })),
        },
      },
      include: rachaInclude,
    });
    return { ...racha, summary: summarize(racha) };
  },

  async update(arenaId: string, rachaId: string, input: { numberOfPlayers?: number; notes?: string }) {
    await findOwnedRacha(arenaId, rachaId);
    const racha = await prisma.racha.update({
      where: { id: rachaId },
      data: {
        ...(input.numberOfPlayers !== undefined ? { numberOfPlayers: input.numberOfPlayers } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: rachaInclude,
    });
    return { ...racha, summary: summarize(racha) };
  },

  async remove(arenaId: string, rachaId: string) {
    await findOwnedRacha(arenaId, rachaId);
    // Itens e comandas caem junto por cascade.
    await prisma.racha.delete({ where: { id: rachaId } });
  },

  async get(arenaId: string, rachaId: string) {
    const racha = await prisma.racha.findFirst({ where: { id: rachaId, arenaId }, include: rachaInclude });
    if (!racha) throw new NotFoundError('Racha');
    return { ...racha, summary: summarize(racha) };
  },

  async list(arenaId: string, filters: { from?: Date; to?: Date; status?: RachaStatus; courtId?: string } = {}) {
    const { from, to, status, courtId } = filters;
    const rachas = await prisma.racha.findMany({
      where: {
        arenaId,
        ...(from || to ? { date: { gte: from, lte: to } } : {}),
        ...(status ? { status } : {}),
        ...(courtId ? { courtId } : {}),
      },
      include: rachaInclude,
      orderBy: { date: 'desc' },
    });
    return rachas.map((racha) => ({ ...racha, summary: summarize(racha) }));
  },

  async setStatus(arenaId: string, rachaId: string, status: RachaStatus) {
    await findOwnedRacha(arenaId, rachaId);
    const racha = await prisma.racha.update({ where: { id: rachaId }, data: { status }, include: rachaInclude });
    return { ...racha, summary: summarize(racha) };
  },

  async addComanda(arenaId: string, rachaId: string, input: ComandaInput) {
    await findOwnedRacha(arenaId, rachaId);
    const priceByProduct = await validateProductsBelongToArena(arenaId, input.items);

    await prisma.comanda.create({
      data: {
        rachaId,
        playerName: input.playerName,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: priceByProduct.get(item.productId)!,
          })),
        },
      },
    });

    return this.get(arenaId, rachaId);
  },

  async updateComanda(arenaId: string, rachaId: string, comandaId: string, input: Partial<ComandaInput>) {
    await findOwnedRacha(arenaId, rachaId);
    const comanda = await prisma.comanda.findFirst({ where: { id: comandaId, rachaId } });
    if (!comanda) throw new NotFoundError('Comanda');

    if (input.items) {
      const priceByProduct = await validateProductsBelongToArena(arenaId, input.items);
      await prisma.comandaItem.deleteMany({ where: { comandaId } });
      await prisma.comanda.update({
        where: { id: comandaId },
        data: {
          ...(input.playerName ? { playerName: input.playerName } : {}),
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: priceByProduct.get(item.productId)!,
            })),
          },
        },
      });
    } else if (input.playerName) {
      await prisma.comanda.update({ where: { id: comandaId }, data: { playerName: input.playerName } });
    }

    return this.get(arenaId, rachaId);
  },

  async removeComanda(arenaId: string, rachaId: string, comandaId: string) {
    await findOwnedRacha(arenaId, rachaId);
    const comanda = await prisma.comanda.findFirst({ where: { id: comandaId, rachaId } });
    if (!comanda) throw new NotFoundError('Comanda');
    await prisma.comanda.delete({ where: { id: comandaId } });
    return this.get(arenaId, rachaId);
  },
};
