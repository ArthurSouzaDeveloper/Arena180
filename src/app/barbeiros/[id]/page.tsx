import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PerfilPublicoBarbeiroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const perfil = await prisma.perfilBarbeiro.findUnique({
    where: { usuarioId: id },
    include: {
      usuario: { select: { nome: true, telefone: true } },
      portfolioFotos: { orderBy: { ordem: "asc" } },
    },
  });

  if (!perfil) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">{perfil.usuario.nome}</h1>
        <p className="text-neutral-600">
          {perfil.cidade}
          {perfil.bairro ? ` · ${perfil.bairro}` : ""} · atende em até{" "}
          {perfil.raioAtendimentoKm}km
        </p>
        <p className="mt-1 text-sm">
          ★ {Number(perfil.notaMedia).toFixed(1)} ({perfil.totalAvaliacoes}{" "}
          avaliações)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {perfil.especialidades.map((especialidade) => (
          <span
            key={especialidade}
            className="rounded-full bg-neutral-100 px-3 py-1 text-sm"
          >
            {especialidade}
          </span>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Experiência</h2>
        <p className="text-neutral-700">
          {perfil.anosExperiencia} anos de experiência.
        </p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Valor da diária</h2>
        <p className="text-neutral-700">
          R$ {Number(perfil.valorDiariaPadrao).toFixed(2)}
        </p>
      </div>

      {perfil.portfolioFotos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Portfólio</h2>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {perfil.portfolioFotos.map((foto) => (
              <div key={foto.id} className="relative aspect-square">
                <Image
                  src={foto.urlImagem}
                  alt="Trabalho do barbeiro"
                  fill
                  className="rounded-md object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
