"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const formData = new FormData(event.currentTarget);
    const resultado = await signIn("credentials", {
      email: formData.get("email"),
      senha: formData.get("senha"),
      redirect: false,
    });

    setEnviando(false);

    if (resultado?.error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }

    router.push("/");
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            name="senha"
            type="password"
            required
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button
          type="submit"
          disabled={enviando}
          className="mt-2 rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="text-sm text-neutral-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="underline">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
