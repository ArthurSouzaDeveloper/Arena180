import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { expirarContratacoesPendentes } from "@/lib/contratacao";
import { prisma } from "@/lib/prisma";
import { ROTULOS_STATUS_CONTRATACAO } from "@/lib/status-contratacao";

export default async function ContratacoesPage() {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEARIA") {
    redirect("/login");
  }

  await expirarContratacoesPendentes();

  const contratacoes = await prisma.contratacao.findMany({
    where: { barbeariaId: session.user.id },
    orderBy: { criadoEm: "desc" },
    include: { barbeiro: { select: { nome: true } } },
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
              className="rounded-md border border-neutral-200 p-4"
            >
              <p className="font-medium">{contratacao.barbeiro.nome}</p>
              <p className="text-sm text-neutral-600">
                {contratacao.dataInicio.toLocaleDateString("pt-BR")} até{" "}
                {contratacao.dataFim.toLocaleDateString("pt-BR")} · Total: R${" "}
                {Number(contratacao.valorTotal).toFixed(2)}
              </p>
              <p className="mt-1 text-sm">
                {ROTULOS_STATUS_CONTRATACAO[contratacao.status]}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
