import { NextResponse } from "next/server";
import { transicaoValida } from "@/lib/contratacao";
import { buscarPagamento } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const url = new URL(request.url);
  let tipo = url.searchParams.get("type");
  let paymentId = url.searchParams.get("data.id");

  if (!tipo || !paymentId) {
    const body = await request.json().catch(() => null);
    tipo = tipo ?? body?.type ?? null;
    paymentId = paymentId ?? body?.data?.id ?? null;
  }

  if (tipo !== "payment" || !paymentId) {
    return NextResponse.json({ ok: true });
  }

  const pagamentoMp = await buscarPagamento(String(paymentId)).catch(
    () => null,
  );
  const contratacaoId = pagamentoMp?.external_reference;
  if (!pagamentoMp || !contratacaoId) {
    return NextResponse.json({ ok: true });
  }

  const contratacao = await prisma.contratacao.findUnique({
    where: { id: contratacaoId },
  });
  if (!contratacao) {
    return NextResponse.json({ ok: true });
  }

  if (pagamentoMp.status === "approved") {
    if (transicaoValida(contratacao.status, "PAGA")) {
      await prisma.$transaction([
        prisma.pagamento.update({
          where: { contratacaoId },
          data: {
            mpPaymentId: String(pagamentoMp.id),
            statusSplit: "PROCESSADO",
          },
        }),
        prisma.contratacao.update({
          where: { id: contratacaoId },
          data: { status: "PAGA" },
        }),
        prisma.conversa.upsert({
          where: { contratacaoId },
          update: {},
          create: { contratacaoId },
        }),
      ]);
    }
  } else if (["rejected", "cancelled"].includes(pagamentoMp.status)) {
    await prisma.pagamento.update({
      where: { contratacaoId },
      data: { mpPaymentId: String(pagamentoMp.id), statusSplit: "FALHOU" },
    });
  }

  return NextResponse.json({ ok: true });
}
