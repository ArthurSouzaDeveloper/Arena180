import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  expirarContratacoesPendentes,
  transicaoValida,
} from "@/lib/contratacao";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEIRO") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  await expirarContratacoesPendentes();

  const { id } = await params;
  const contratacao = await prisma.contratacao.findUnique({ where: { id } });

  if (!contratacao || contratacao.barbeiroId !== session.user.id) {
    return NextResponse.json(
      { erro: "Contratação não encontrada." },
      { status: 404 },
    );
  }

  if (!transicaoValida(contratacao.status, "RECUSADA")) {
    return NextResponse.json(
      { erro: "Essa contratação não pode mais ser recusada." },
      { status: 409 },
    );
  }

  const atualizada = await prisma.contratacao.update({
    where: { id },
    data: { status: "RECUSADA" },
  });

  return NextResponse.json({ contratacao: atualizada });
}
