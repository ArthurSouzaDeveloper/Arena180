import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type FiltroBuscaBarbeiros = {
  cidade?: string;
  especialidade?: string;
  precoMin?: number;
  precoMax?: number;
};

export function construirFiltroBusca(
  filtro: FiltroBuscaBarbeiros,
): Prisma.PerfilBarbeiroWhereInput {
  const where: Prisma.PerfilBarbeiroWhereInput = {};

  if (filtro.cidade) {
    where.cidade = { equals: filtro.cidade, mode: "insensitive" };
  }

  if (filtro.especialidade) {
    where.especialidades = { has: filtro.especialidade };
  }

  if (filtro.precoMin !== undefined || filtro.precoMax !== undefined) {
    where.valorDiariaPadrao = {
      ...(filtro.precoMin !== undefined ? { gte: filtro.precoMin } : {}),
      ...(filtro.precoMax !== undefined ? { lte: filtro.precoMax } : {}),
    };
  }

  return where;
}

export function buscarBarbeiros(filtro: FiltroBuscaBarbeiros) {
  return prisma.perfilBarbeiro.findMany({
    where: construirFiltroBusca(filtro),
    include: {
      usuario: { select: { nome: true } },
      portfolioFotos: { orderBy: { ordem: "asc" }, take: 1 },
    },
    orderBy: { notaMedia: "desc" },
  });
}
