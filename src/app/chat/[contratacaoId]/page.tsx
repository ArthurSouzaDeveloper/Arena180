import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { statusPermiteChat, usuarioParticipaContratacao } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { ChatConversa } from "@/components/chat-conversa";

export default async function ChatContratacaoPage({
  params,
}: {
  params: Promise<{ contratacaoId: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { contratacaoId } = await params;
  const contratacao = await prisma.contratacao.findUnique({
    where: { id: contratacaoId },
    include: {
      barbearia: { select: { nome: true } },
      barbeiro: { select: { nome: true } },
    },
  });

  if (!contratacao) {
    notFound();
  }

  if (!usuarioParticipaContratacao(contratacao, session.user.id)) {
    notFound();
  }

  if (!statusPermiteChat(contratacao.status)) {
    redirect(session.user.tipo === "BARBEARIA" ? "/contratacoes" : "/pedidos");
  }

  const conversa = await prisma.conversa.upsert({
    where: { contratacaoId },
    update: {},
    create: { contratacaoId },
  });

  const mensagens = await prisma.mensagem.findMany({
    where: { conversaId: conversa.id },
    orderBy: { criadoEm: "asc" },
    include: { remetente: { select: { nome: true } } },
  });

  const outraParte =
    session.user.tipo === "BARBEARIA"
      ? contratacao.barbeiro.nome
      : contratacao.barbearia.nome;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-16">
      <h1 className="page-title">Conversa com {outraParte}</h1>
      <ChatConversa
        conversaId={conversa.id}
        usuarioId={session.user.id}
        mensagensIniciais={mensagens.map((mensagem) => ({
          id: mensagem.id,
          texto: mensagem.texto,
          criadoEm: mensagem.criadoEm.toISOString(),
          remetenteId: mensagem.remetenteId,
          remetenteNome: mensagem.remetente.nome,
        }))}
      />
    </main>
  );
}
