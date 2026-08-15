import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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
    include: { barbearia: { select: { nome: true } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Pedidos de contratação</h1>

      {pedidos.length === 0 ? (
        <p className="text-neutral-600">Você ainda não recebeu pedidos.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-4"
            >
              <div>
                <p className="font-medium">{pedido.barbearia.nome}</p>
                <p className="text-sm text-neutral-600">
                  {pedido.dataInicio.toLocaleDateString("pt-BR")} até{" "}
                  {pedido.dataFim.toLocaleDateString("pt-BR")} · R${" "}
                  {Number(pedido.valorBarbeiro).toFixed(2)}
                </p>
                <p className="mt-1 text-sm">
                  {ROTULOS_STATUS_CONTRATACAO[pedido.status]}
                </p>
              </div>
              {pedido.status === "PENDENTE" && (
                <AcoesContratacao contratacaoId={pedido.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
