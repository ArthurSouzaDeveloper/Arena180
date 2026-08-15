import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PerfilBarbeiroForm } from "@/components/perfil-barbeiro-form";
import { PortfolioUpload } from "@/components/portfolio-upload";

export default async function PerfilPage() {
  const session = await auth();

  if (!session || session.user.tipo !== "BARBEIRO") {
    redirect("/login");
  }

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
