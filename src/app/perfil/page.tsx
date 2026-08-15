import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PerfilBarbeiroForm } from "@/components/perfil-barbeiro-form";
import { PortfolioUpload } from "@/components/portfolio-upload";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ mp?: string }>;
}) {
  const session = await auth();

  if (!session || session.user.tipo !== "BARBEIRO") {
    redirect("/login");
  }

  const { mp } = await searchParams;

  const perfil = await prisma.perfilBarbeiro.findUnique({
    where: { usuarioId: session.user.id },
    include: { portfolioFotos: { orderBy: { ordem: "asc" } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Meu perfil profissional</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Essas informações aparecem para as barbearias que buscam
          profissionais.
        </p>
      </div>

      {mp === "sucesso" && (
        <p className="text-sm text-green-700">
          Conta Mercado Pago conectada com sucesso.
        </p>
      )}
      {mp === "erro" && (
        <p className="text-sm text-red-600">
          Não foi possível conectar sua conta Mercado Pago. Tente novamente.
        </p>
      )}

      {perfil && (
        <div className="rounded-md border border-neutral-200 p-4">
          <h2 className="text-lg font-semibold">Recebimento de pagamentos</h2>
          {perfil.mpAccountId ? (
            <p className="mt-1 text-sm text-green-700">
              Conta Mercado Pago conectada. Você já pode receber contratações.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-neutral-600">
                Conecte sua conta Mercado Pago para poder receber contratações.
                Sem isso, seu perfil não aparece disponível para as barbearias.
              </p>
              <Link
                href="/api/mercadopago/conectar"
                className="mt-3 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
              >
                Conectar Mercado Pago
              </Link>
            </>
          )}
        </div>
      )}

      <PerfilBarbeiroForm
        valoresIniciais={
          perfil
            ? {
                anosExperiencia: perfil.anosExperiencia,
                especialidades: perfil.especialidades,
                cidade: perfil.cidade,
                bairro: perfil.bairro ?? "",
                raioAtendimentoKm: perfil.raioAtendimentoKm,
                valorDiariaPadrao: Number(perfil.valorDiariaPadrao),
              }
            : null
        }
      />

      <div>
        <h2 className="text-lg font-semibold">Portfólio de fotos</h2>
        {perfil ? (
          <PortfolioUpload fotosIniciais={perfil.portfolioFotos} />
        ) : (
          <p className="mt-2 text-sm text-neutral-600">
            Salve as informações acima primeiro para poder enviar fotos do seu
            portfólio.
          </p>
        )}
      </div>
    </main>
  );
}
