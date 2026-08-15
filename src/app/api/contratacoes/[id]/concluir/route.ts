import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { transicaoValida } from "@/lib/contratacao";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEARIA") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const contratacao = await prisma.contratacao.findUnique({ where: { id } });

  if (!contratacao || contratacao.barbeariaId !== session.user.id) {
    return NextResponse.json(
      { erro: "Contratação não encontrada." },
      { status: 404 },
    );
  }

  if (!transicaoValida(contratacao.status, "CONCLUIDA")) {
    return NextResponse.json(
      { erro: "Essa contratação não pode ser marcada como concluída." },
      { status: 409 },
    );
  }

  if (contratacao.dataFim > new Date()) {
    return NextResponse.json(
      { erro: "A data de término dessa contratação ainda não chegou." },
      { status: 409 },
    );
  }

  const atualizada = await prisma.contratacao.update({
    where: { id },
    data: { status: "CONCLUIDA" },
  });

  return NextResponse.json({ contratacao: atualizada });
}
