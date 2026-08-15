import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { statusPermiteChat } from "@/lib/chat";
import { expirarContratacoesPendentes } from "@/lib/contratacao";
import { prisma } from "@/lib/prisma";
import { ROTULOS_STATUS_CONTRATACAO } from "@/lib/status-contratacao";
import { AcoesContratacao } from "@/components/acoes-contratacao";

export default async function PedidosPage() {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEIRO") {
    redirect("/login");
  }

  await expirarContratacoesPendentes();

  const pedidos = await prisma.contratacao.findMany({
    where: { barbeiroId: session.user.id },
    orderBy: { criadoEm: "desc" },
    include: { barbearia: { select: { nome: true } }, avaliacao: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="page-title">Pedidos de contratação</h1>

      {pedidos.length === 0 ? (
        <p className="text-parchment-dim">Você ainda não recebeu pedidos.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="card flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display font-medium text-parchment">
                    {pedido.barbearia.nome}
                  </p>
                  <p className="text-sm text-parchment-dim">
                    {pedido.dataInicio.toLocaleDateString("pt-BR")} até{" "}
                    {pedido.dataFim.toLocaleDateString("pt-BR")} · R${" "}
                    {Number(pedido.valorBarbeiro).toFixed(2)}
                  </p>
                  <p className="mt-1 font-mono text-xs tracking-wide text-brass uppercase">
                    {ROTULOS_STATUS_CONTRATACAO[pedido.status]}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {pedido.status === "PENDENTE" && (
                    <AcoesContratacao contratacaoId={pedido.id} />
                  )}
                  {statusPermiteChat(pedido.status) && (
                    <Link href={`/chat/${pedido.id}`} className="btn-secondary">
                      Chat
                    </Link>
                  )}
                </div>
              </div>
              {pedido.avaliacao && (
                <p className="text-sm text-parchment-dim">
                  Avaliação recebida: ★ {pedido.avaliacao.nota}
                  {pedido.avaliacao.comentario
                    ? ` — "${pedido.avaliacao.comentario}"`
                    : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
