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
        <h1 className="page-title">Meu perfil profissional</h1>
        <p className="mt-1 text-sm text-parchment-dim">
          Essas informações aparecem para as barbearias que buscam
          profissionais.
        </p>
      </div>

      {mp === "sucesso" && (
        <p className="text-sm text-emerald-400">
          Conta Mercado Pago conectada com sucesso.
        </p>
      )}
      {mp === "erro" && (
        <p className="text-sm text-red-400">
          Não foi possível conectar sua conta Mercado Pago. Tente novamente.
        </p>
      )}

      {perfil && (
        <div className="card p-4">
          <h2 className="font-display text-lg font-semibold text-parchment">
            Recebimento de pagamentos
          </h2>
          {perfil.mpAccountId ? (
            <p className="mt-1 text-sm text-emerald-400">
              Conta Mercado Pago conectada. Você já pode receber contratações.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-parchment-dim">
                Conecte sua conta Mercado Pago para poder receber contratações.
                Sem isso, seu perfil não aparece disponível para as barbearias.
              </p>
              <Link
                href="/api/mercadopago/conectar"
                className="btn-primary mt-3"
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
        <h2 className="font-display text-lg font-semibold text-parchment">
          Portfólio de fotos
        </h2>
        {perfil ? (
          <PortfolioUpload fotosIniciais={perfil.portfolioFotos} />
        ) : (
          <p className="mt-2 text-sm text-parchment-dim">
            Salve as informações acima primeiro para poder enviar fotos do seu
            portfólio.
          </p>
        )}
      </div>
    </main>
  );
}
