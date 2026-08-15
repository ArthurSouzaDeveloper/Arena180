import Link from "next/link";

export default function CadastroPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <h1 className="page-title">Criar conta na Arena180</h1>
      <p className="text-center text-sm text-parchment-dim">
        Escolha o tipo de conta para continuar.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/cadastro/barbearia"
          className="card px-6 py-4 text-center font-medium text-parchment transition-colors hover:border-brass"
        >
          Sou barbearia
          <span className="mt-1 block text-xs font-normal text-parchment-dim">
            Quero contratar barbeiros freelancer
          </span>
        </Link>
        <Link
          href="/cadastro/barbeiro"
          className="card px-6 py-4 text-center font-medium text-parchment transition-colors hover:border-brass"
        >
          Sou barbeiro
          <span className="mt-1 block text-xs font-normal text-parchment-dim">
            Quero oferecer meus serviços por período
          </span>
        </Link>
      </div>
      <p className="text-sm text-parchment-dim">
        Já tem conta?{" "}
        <Link href="/login" className="link-brass">
          Entrar
        </Link>
      </p>
    </main>
  );
}
