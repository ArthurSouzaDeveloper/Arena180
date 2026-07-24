import { Prisma, RachaStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function rachaTotal(racha: {
  courtPrice: Prisma.Decimal;
  items: { quantity: number; unitPrice: Prisma.Decimal }[];
  comandas: { items: { quantity: number; unitPrice: Prisma.Decimal }[] }[];
}): number {
  const consumption = racha.items.reduce((sum, item) => sum + item.quantity * toNumber(item.unitPrice), 0);
  const comandasConsumption = racha.comandas.reduce(
    (sum, comanda) => sum + comanda.items.reduce((s, item) => s + item.quantity * toNumber(item.unitPrice), 0),
    0,
  );
  return toNumber(racha.courtPrice) + consumption + comandasConsumption;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const dashboardService = {
  async summary(quadraId: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const rachas = await prisma.racha.findMany({
      where: { quadraId, status: RachaStatus.FECHADO, date: { gte: monthStart } },
      include: { items: true, comandas: { include: { items: true } } },
    });

    let faturamentoHoje = 0;
    let faturamentoSemana = 0;
    let faturamentoMes = 0;
    let rachasHoje = 0;

    for (const racha of rachas) {
      const total = rachaTotal(racha);
      faturamentoMes += total;
      if (racha.date >= weekStart) faturamentoSemana += total;
      if (racha.date >= todayStart) {
        faturamentoHoje += total;
        rachasHoje += 1;
      }
    }

    const round = (n: number) => Math.round(n * 100) / 100;

    return {
      faturamentoHoje: round(faturamentoHoje),
      faturamentoSemana: round(faturamentoSemana),
      faturamentoMes: round(faturamentoMes),
      rachasHoje,
      rachasNoMes: rachas.length,
      ticketMedio: rachas.length ? round(faturamentoMes / rachas.length) : 0,
    };
  },
};
