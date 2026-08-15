import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calcularComissao } from "@/lib/comissao";
import { calcularExpiracao } from "@/lib/contratacao";
import { prisma } from "@/lib/prisma";
import { solicitarContratacaoSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEARIA") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = solicitarContratacaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const perfilBarbeiro = await prisma.perfilBarbeiro.findUnique({
    where: { usuarioId: parsed.data.barbeiroId },
  });
  if (!perfilBarbeiro) {
    return NextResponse.json(
      { erro: "Barbeiro não encontrado." },
      { status: 404 },
    );
  }

  const { valorBarbeiro, valorComissao, valorTotal } = calcularComissao(
    Number(perfilBarbeiro.valorDiariaPadrao),
  );

  const contratacao = await prisma.contratacao.create({
    data: {
      barbeariaId: session.user.id,
      barbeiroId: parsed.data.barbeiroId,
      dataInicio: parsed.data.dataInicio,
      dataFim: parsed.data.dataFim,
      valorBarbeiro,
      valorComissao,
      valorTotal,
      expiraEm: calcularExpiracao(),
    },
  });

  return NextResponse.json({ contratacao }, { status: 201 });
}
