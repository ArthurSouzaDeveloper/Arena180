import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <p className="eyebrow">Barbearias · Barbeiros freelancer</p>
      <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-tight text-parchment sm:text-6xl">
        A cadeira certa,
        <br />
        no dia certo.
      </h1>
      <div className="pole-rule" />
      <p className="max-w-md text-parchment-dim">
        Barbearias contratam barbeiros freelancer por período, com pagamento e
        repasse automáticos. Sem planilha, sem calote.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href="/cadastro" className="btn-primary px-6 py-3">
          Criar conta
        </Link>
        <Link href="/login" className="btn-secondary px-6 py-3">
          Entrar
        </Link>
      </div>
    </main>
  );
}
