import { prisma } from "../../config/database";
import { AppError, NotFoundError } from "../../domain/errors";

interface RachaItemInput {
  productId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CreateRachaInput {
  quadraId: string;
  courtValue: number;
  playersCount: number;
  playedAt?: string;
  items: RachaItemInput[];
}

function calculateTotals(courtValue: number, items: RachaItemInput[], playersCount: number) {
  const itemsTotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalValue = courtValue + itemsTotal;
  const valuePerHead = playersCount > 0 ? totalValue / playersCount : 0;
  return { totalValue, valuePerHead };
}

export const rachaService = {
  list(quadraId: string) {
    return prisma.racha.findMany({
      where: { quadraId },
      include: { items: true },
      orderBy: { playedAt: "desc" },
    });
  },

  async getById(id: string, quadraId: string) {
    const racha = await prisma.racha.findFirst({
      where: { id, quadraId },
      include: { items: true },
    });
    if (!racha) {
      throw new NotFoundError("Racha não encontrada");
    }
    return racha;
  },

  calculate(courtValue: number, playersCount: number, items: RachaItemInput[]) {
    return calculateTotals(courtValue, items, playersCount);
  },

  async create({ quadraId, courtValue, playersCount, playedAt, items }: CreateRachaInput) {
    const productIds = items.map((item) => item.productId).filter((id): id is string => Boolean(id));
    if (productIds.length > 0) {
      const owned = await prisma.product.count({ where: { id: { in: productIds }, quadraId } });
      if (owned !== new Set(productIds).size) {
        throw new AppError("Um ou mais produtos informados não pertencem a esta arena");
      }
    }

    const { totalValue, valuePerHead } = calculateTotals(courtValue, items, playersCount);

    return prisma.racha.create({
      data: {
        quadraId,
        courtValue,
        playersCount,
        totalValue,
        valuePerHead,
        playedAt: playedAt ? new Date(playedAt) : new Date(),
        status: "FECHADA",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
  },

  async remove(id: string, quadraId: string) {
    const racha = await prisma.racha.findFirst({ where: { id, quadraId } });
    if (!racha) {
      throw new NotFoundError("Racha não encontrada");
    }
    await prisma.racha.delete({ where: { id } });
  },
};

export type { RachaItemInput };
