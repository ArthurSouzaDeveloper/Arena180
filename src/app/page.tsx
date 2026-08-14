import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">Arena180</h1>
      <p className="max-w-md text-neutral-600">
        Conectamos barbearias a barbeiros freelancer disponíveis por período.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/cadastro"
          className="rounded-md bg-neutral-900 px-6 py-3 font-medium text-white"
        >
          Criar conta
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-6 py-3 font-medium"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
