import { StatusContratacao } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PRAZO_ACEITE_HORAS = 24;

const TRANSICOES_VALIDAS: Record<StatusContratacao, StatusContratacao[]> = {
  PENDENTE: ["ACEITA", "RECUSADA", "EXPIRADA"],
  ACEITA: ["PAGA"],
  RECUSADA: [],
  EXPIRADA: [],
  PAGA: ["CONCLUIDA"],
  CONCLUIDA: ["AVALIADA"],
  AVALIADA: [],
};

export function transicaoValida(
  atual: StatusContratacao,
  novo: StatusContratacao,
): boolean {
  return TRANSICOES_VALIDAS[atual].includes(novo);
}

export function calcularExpiracao(agora: Date = new Date()): Date {
  return new Date(agora.getTime() + PRAZO_ACEITE_HORAS * 60 * 60 * 1000);
}

/**
 * Marca como EXPIRADA qualquer contratação PENDENTE cujo prazo de aceite já
 * passou. Chamada de forma preguiçosa (lazy) antes de listar contratações,
 * em vez de depender de um job agendado.
 */
export async function expirarContratacoesPendentes(): Promise<void> {
  await prisma.contratacao.updateMany({
    where: { status: "PENDENTE", expiraEm: { lt: new Date() } },
    data: { status: "EXPIRADA" },
  });
}
