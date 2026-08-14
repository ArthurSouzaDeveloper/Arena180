import Link from "next/link";

export default function CadastroPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Criar conta na Arena180</h1>
      <p className="text-center text-sm text-neutral-600">
        Escolha o tipo de conta para continuar.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/cadastro/barbearia"
          className="rounded-md border border-neutral-300 px-6 py-4 text-center font-medium hover:border-neutral-500"
        >
          Sou barbearia
          <span className="mt-1 block text-xs font-normal text-neutral-500">
            Quero contratar barbeiros freelancer
          </span>
        </Link>
        <Link
          href="/cadastro/barbeiro"
          className="rounded-md border border-neutral-300 px-6 py-4 text-center font-medium hover:border-neutral-500"
        >
          Sou barbeiro
          <span className="mt-1 block text-xs font-normal text-neutral-500">
            Quero oferecer meus serviços por período
          </span>
        </Link>
      </div>
      <p className="text-sm text-neutral-600">
        Já tem conta?{" "}
        <Link href="/login" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
