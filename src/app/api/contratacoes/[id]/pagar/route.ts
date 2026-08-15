import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { criarPreferenciaPagamento } from "@/lib/mercadopago";
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
  const contratacao = await prisma.contratacao.findUnique({
    where: { id },
    include: {
      barbeiro: { select: { nome: true, perfilBarbeiro: true } },
    },
  });

  if (!contratacao || contratacao.barbeariaId !== session.user.id) {
    return NextResponse.json(
      { erro: "Contratação não encontrada." },
      { status: 404 },
    );
  }

  if (contratacao.status !== "ACEITA") {
    return NextResponse.json(
      { erro: "Essa contratação não está pronta para pagamento." },
      { status: 409 },
    );
  }

  const perfilBarbeiro = contratacao.barbeiro.perfilBarbeiro;
  if (!perfilBarbeiro?.mpAccessToken) {
    return NextResponse.json(
      { erro: "O barbeiro ainda não conectou uma conta Mercado Pago." },
      { status: 409 },
    );
  }

  let preferencia;
  try {
    preferencia = await criarPreferenciaPagamento({
      accessTokenVendedor: perfilBarbeiro.mpAccessToken,
      contratacaoId: contratacao.id,
      descricao: `Contratação de ${contratacao.barbeiro.nome} — FreeBarber`,
      valorTotal: Number(contratacao.valorTotal),
      valorComissao: Number(contratacao.valorComissao),
    });
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível iniciar o pagamento no Mercado Pago." },
      { status: 502 },
    );
  }

  await prisma.pagamento.upsert({
    where: { contratacaoId: contratacao.id },
    update: {
      mpPreferenceId: preferencia.id,
      valorTotal: contratacao.valorTotal,
      valorRepassadoBarbeiro: contratacao.valorBarbeiro,
      valorComissaoPlataforma: contratacao.valorComissao,
    },
    create: {
      contratacaoId: contratacao.id,
      mpPreferenceId: preferencia.id,
      valorTotal: contratacao.valorTotal,
      valorRepassadoBarbeiro: contratacao.valorBarbeiro,
      valorComissaoPlataforma: contratacao.valorComissao,
    },
  });

  return NextResponse.json({ initPoint: preferencia.init_point });
}
