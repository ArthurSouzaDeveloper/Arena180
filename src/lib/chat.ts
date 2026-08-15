import type { StatusContratacao } from "@/generated/prisma/client";

export function usuarioParticipaContratacao(
  contratacao: { barbeariaId: string; barbeiroId: string },
  usuarioId: string,
): boolean {
  return (
    contratacao.barbeariaId === usuarioId ||
    contratacao.barbeiroId === usuarioId
  );
}

const STATUS_QUE_PERMITEM_CHAT: StatusContratacao[] = [
  "PAGA",
  "CONCLUIDA",
  "AVALIADA",
];

export function statusPermiteChat(status: StatusContratacao): boolean {
  return STATUS_QUE_PERMITEM_CHAT.includes(status);
}
