import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { calcularComissao } from "@/lib/comissao";
import { prisma } from "@/lib/prisma";
import { SolicitarContratacaoForm } from "@/components/solicitar-contratacao-form";

export default async function ContratarBarbeiroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEARIA") {
    redirect("/login");
  }

  const { id } = await params;
  const perfil = await prisma.perfilBarbeiro.findUnique({
    where: { usuarioId: id },
    include: { usuario: { select: { nome: true } } },
  });

  if (!perfil) {
    notFound();
  }
  if (!perfil.mpAccountId) {
    redirect(`/barbeiros/${id}`);
  }

  const { valorBarbeiro, valorComissao, valorTotal } = calcularComissao(
    Number(perfil.valorDiariaPadrao),
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">
          Contratar {perfil.usuario.nome}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Escolha o período desejado e confirme a solicitação.
        </p>
      </div>

      <div className="rounded-md border border-neutral-200 p-4 text-sm">
        <div className="flex justify-between">
          <span>Valor do barbeiro</span>
          <span>R$ {valorBarbeiro.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Taxa da plataforma</span>
          <span>R$ {valorComissao.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 font-medium">
          <span>Total a pagar</span>
          <span>R$ {valorTotal.toFixed(2)}</span>
        </div>
      </div>

      <SolicitarContratacaoForm barbeiroId={id} />
    </main>
  );
}
