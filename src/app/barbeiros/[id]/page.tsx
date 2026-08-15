import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PerfilPublicoBarbeiroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

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
        <h1 className="page-title">{perfil.usuario.nome}</h1>
        <p className="mt-1 text-parchment-dim">
          {perfil.cidade}
          {perfil.bairro ? ` · ${perfil.bairro}` : ""} · atende em até{" "}
          {perfil.raioAtendimentoKm}km
        </p>
        <p className="mt-1 font-mono text-sm text-brass">
          ★ {Number(perfil.notaMedia).toFixed(1)} ({perfil.totalAvaliacoes}{" "}
          avaliações)
        </p>
        {session?.user.tipo === "BARBEARIA" &&
          (perfil.mpAccountId ? (
            <Link
              href={`/barbeiros/${id}/contratar`}
              className="btn-primary mt-4"
            >
              Contratar
            </Link>
          ) : (
            <p className="mt-4 text-sm text-parchment-dim">
              Este barbeiro ainda não habilitou pagamentos.
            </p>
          ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {perfil.especialidades.map((especialidade) => (
          <span key={especialidade} className="badge">
            {especialidade}
          </span>
        ))}
      </div>

      <div>
        <h2 className="eyebrow">Experiência</h2>
        <p className="mt-1 text-parchment">
          {perfil.anosExperiencia} anos de experiência.
        </p>
      </div>

      <div>
        <h2 className="eyebrow">Valor da diária</h2>
        <p className="mt-1 font-mono text-parchment">
          R$ {Number(perfil.valorDiariaPadrao).toFixed(2)}
        </p>
      </div>

      {perfil.portfolioFotos.length > 0 && (
        <div>
          <h2 className="eyebrow">Portfólio</h2>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {perfil.portfolioFotos.map((foto) => (
              <div key={foto.id} className="relative aspect-square">
                <Image
                  src={foto.urlImagem}
                  alt="Trabalho do barbeiro"
                  fill
                  className="rounded-sm object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
