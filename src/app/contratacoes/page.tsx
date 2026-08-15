import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { statusPermiteChat } from "@/lib/chat";
import { expirarContratacoesPendentes } from "@/lib/contratacao";
import { prisma } from "@/lib/prisma";
import { ROTULOS_STATUS_CONTRATACAO } from "@/lib/status-contratacao";
import { PagarContratacaoButton } from "@/components/pagar-contratacao-button";
import { ConcluirContratacaoButton } from "@/components/concluir-contratacao-button";
import { AvaliarContratacaoForm } from "@/components/avaliar-contratacao-form";

export default async function ContratacoesPage() {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEARIA") {
    redirect("/login");
  }

  await expirarContratacoesPendentes();

  const contratacoes = await prisma.contratacao.findMany({
    where: { barbeariaId: session.user.id },
    orderBy: { criadoEm: "desc" },
    include: { barbeiro: { select: { nome: true } }, avaliacao: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Minhas contratações</h1>

      {contratacoes.length === 0 ? (
        <p className="text-neutral-600">
          Você ainda não solicitou nenhuma contratação.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {contratacoes.map((contratacao) => (
            <div
              key={contratacao.id}
              className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{contratacao.barbeiro.nome}</p>
                  <p className="text-sm text-neutral-600">
                    {contratacao.dataInicio.toLocaleDateString("pt-BR")} até{" "}
                    {contratacao.dataFim.toLocaleDateString("pt-BR")} · Total:
                    R$ {Number(contratacao.valorTotal).toFixed(2)}
                  </p>
                  <p className="mt-1 text-sm">
                    {ROTULOS_STATUS_CONTRATACAO[contratacao.status]}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {contratacao.status === "ACEITA" && (
                    <PagarContratacaoButton contratacaoId={contratacao.id} />
                  )}
                  {contratacao.status === "PAGA" && (
                    <ConcluirContratacaoButton contratacaoId={contratacao.id} />
                  )}
                  {statusPermiteChat(contratacao.status) && (
                    <Link
                      href={`/chat/${contratacao.id}`}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium"
                    >
                      Chat
                    </Link>
                  )}
                </div>
              </div>

              {contratacao.status === "CONCLUIDA" && (
                <AvaliarContratacaoForm contratacaoId={contratacao.id} />
              )}
              {contratacao.avaliacao && (
                <p className="text-sm text-neutral-600">
                  Sua avaliação: ★ {contratacao.avaliacao.nota}
                  {contratacao.avaliacao.comentario
                    ? ` — "${contratacao.avaliacao.comentario}"`
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
