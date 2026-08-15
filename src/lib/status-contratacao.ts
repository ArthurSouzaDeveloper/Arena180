import type { StatusContratacao } from "@/generated/prisma/client";

export const ROTULOS_STATUS_CONTRATACAO: Record<StatusContratacao, string> = {
  PENDENTE: "Aguardando resposta",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  EXPIRADA: "Expirada",
  PAGA: "Paga",
  CONCLUIDA: "Concluída",
  AVALIADA: "Avaliada",
};
