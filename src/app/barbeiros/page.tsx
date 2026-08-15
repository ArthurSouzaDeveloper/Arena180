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
      <h1 className="text-2xl font-semibold">Buscar barbeiros freelancer</h1>

      <form className="flex flex-wrap gap-3">
        <input
          name="cidade"
          placeholder="Cidade"
          defaultValue={cidade}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        <input
          name="especialidade"
          placeholder="Especialidade"
          defaultValue={especialidade}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        <input
          name="precoMin"
          type="number"
          placeholder="Preço mín."
          defaultValue={precoMin}
          className="w-32 rounded-md border border-neutral-300 px-3 py-2"
        />
        <input
          name="precoMax"
          type="number"
          placeholder="Preço máx."
          defaultValue={precoMax}
          className="w-32 rounded-md border border-neutral-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white"
        >
          Buscar
        </button>
      </form>

      {barbeiros.length === 0 ? (
        <p className="text-neutral-600">
          Nenhum barbeiro encontrado com esses filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {barbeiros.map((barbeiro) => (
            <Link
              key={barbeiro.id}
              href={`/barbeiros/${barbeiro.usuarioId}`}
              className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3 hover:border-neutral-400"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md bg-neutral-100">
                {barbeiro.portfolioFotos[0] && (
                  <Image
                    src={barbeiro.portfolioFotos[0].urlImagem}
                    alt={barbeiro.usuario.nome}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <span className="font-medium">{barbeiro.usuario.nome}</span>
              <span className="text-sm text-neutral-600">
                {barbeiro.cidade} · {barbeiro.anosExperiencia} anos de
                experiência
              </span>
              <span className="flex flex-wrap gap-1">
                {barbeiro.especialidades.map((especialidade) => (
                  <span
                    key={especialidade}
                    className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs"
                  >
                    {especialidade}
                  </span>
                ))}
              </span>
              <span className="text-sm">
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
