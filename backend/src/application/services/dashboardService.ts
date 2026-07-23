import { prisma } from "../../config/database";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function startOfMonth(date: Date) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

async function sumRevenue(quadraId: string, from: Date) {
  const result = await prisma.racha.aggregate({
    where: { quadraId, status: "FECHADA", playedAt: { gte: from } },
    _sum: { totalValue: true },
  });
  return Number(result._sum.totalValue ?? 0);
}

export const dashboardService = {
  async summary(quadraId: string) {
    const now = new Date();

    const [today, week, month, totalRachas] = await Promise.all([
      sumRevenue(quadraId, startOfDay(now)),
      sumRevenue(quadraId, startOfWeek(now)),
      sumRevenue(quadraId, startOfMonth(now)),
      prisma.racha.count({ where: { quadraId, status: "FECHADA" } }),
    ]);

    return {
      revenueToday: today,
      revenueWeek: week,
      revenueMonth: month,
      totalRachas,
    };
  },
};
