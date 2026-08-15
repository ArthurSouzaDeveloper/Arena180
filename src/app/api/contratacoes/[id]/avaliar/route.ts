import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calcularNovaMediaAvaliacao } from "@/lib/avaliacao";
import { transicaoValida } from "@/lib/contratacao";
import { prisma } from "@/lib/prisma";
import { avaliacaoSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEARIA") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const contratacao = await prisma.contratacao.findUnique({
    where: { id },
    include: { avaliacao: true },
  });

  if (!contratacao || contratacao.barbeariaId !== session.user.id) {
    return NextResponse.json(
      { erro: "Contratação não encontrada." },
      { status: 404 },
    );
  }

  if (contratacao.avaliacao) {
    return NextResponse.json(
      { erro: "Você já avaliou essa contratação." },
      { status: 409 },
    );
  }

  if (!transicaoValida(contratacao.status, "AVALIADA")) {
    return NextResponse.json(
      { erro: "Essa contratação ainda não pode ser avaliada." },
      { status: 409 },
    );
  }

  const body = await request.json();
  const parsed = avaliacaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const perfilBarbeiro = await prisma.perfilBarbeiro.findUnique({
    where: { usuarioId: contratacao.barbeiroId },
  });
  if (!perfilBarbeiro) {
    return NextResponse.json(
      { erro: "Perfil do barbeiro não encontrado." },
      { status: 404 },
    );
  }

  const { novaMedia, novoTotal } = calcularNovaMediaAvaliacao(
    Number(perfilBarbeiro.notaMedia),
    perfilBarbeiro.totalAvaliacoes,
    parsed.data.nota,
  );

  await prisma.$transaction([
    prisma.avaliacao.create({
      data: {
        contratacaoId: id,
        nota: parsed.data.nota,
        comentario: parsed.data.comentario,
      },
    }),
    prisma.contratacao.update({
      where: { id },
      data: { status: "AVALIADA" },
    }),
    prisma.perfilBarbeiro.update({
      where: { usuarioId: contratacao.barbeiroId },
      data: { notaMedia: novaMedia, totalAvaliacoes: novoTotal },
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
