import Image from "next/image";
import Link from "next/link";
import { buscarBarbeiros } from "@/lib/barbeiros";

export default async function BarbeirosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cidade = typeof params.cidade === "string" ? params.cidade : "";
  const especialidade =
    typeof params.especialidade === "string" ? params.especialidade : "";
  const precoMin =
    typeof params.precoMin === "string" && params.precoMin !== ""
      ? Number(params.precoMin)
      : undefined;
  const precoMax =
    typeof params.precoMax === "string" && params.precoMax !== ""
      ? Number(params.precoMax)
      : undefined;

  const barbeiros = await buscarBarbeiros({
    cidade: cidade || undefined,
    especialidade: especialidade || undefined,
    precoMin,
    precoMax,
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-16">
      <div>
        <h1 className="page-title">Buscar barbeiros freelancer</h1>
        <div className="pole-rule mt-3" />
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          name="cidade"
          placeholder="Cidade"
          defaultValue={cidade}
          className="field-input w-auto min-w-[10rem]"
        />
        <input
          name="especialidade"
          placeholder="Especialidade"
          defaultValue={especialidade}
          className="field-input w-auto min-w-[10rem]"
        />
        <input
          name="precoMin"
          type="number"
          placeholder="Preço mín."
          defaultValue={precoMin}
          className="field-input w-28"
        />
        <input
          name="precoMax"
          type="number"
          placeholder="Preço máx."
          defaultValue={precoMax}
          className="field-input w-28"
        />
        <button type="submit" className="btn-primary">
          Buscar
        </button>
      </form>

      {barbeiros.length === 0 ? (
        <p className="text-parchment-dim">
          Nenhum barbeiro encontrado com esses filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {barbeiros.map((barbeiro) => (
            <Link
              key={barbeiro.id}
              href={`/barbeiros/${barbeiro.usuarioId}`}
              className="card group flex flex-col gap-2 overflow-hidden p-3 transition-colors hover:border-brass"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-ink-raised-2">
                {barbeiro.portfolioFotos[0] && (
                  <Image
                    src={barbeiro.portfolioFotos[0].urlImagem}
                    alt={barbeiro.usuario.nome}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="pole-stripe absolute inset-x-0 bottom-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <span className="font-display font-medium text-parchment">
                {barbeiro.usuario.nome}
              </span>
              <span className="text-sm text-parchment-dim">
                {barbeiro.cidade} · {barbeiro.anosExperiencia} anos de
                experiência
              </span>
              <span className="flex flex-wrap gap-1">
                {barbeiro.especialidades.map((especialidade) => (
                  <span key={especialidade} className="badge">
                    {especialidade}
                  </span>
                ))}
              </span>
              <span className="font-mono text-sm text-brass">
                ★ {Number(barbeiro.notaMedia).toFixed(1)} (
                {barbeiro.totalAvaliacoes} avaliações) · R${" "}
                {Number(barbeiro.valorDiariaPadrao).toFixed(2)}/diária
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
