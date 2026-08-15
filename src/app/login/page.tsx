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
      <h1 className="page-title">Entrar</h1>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <label className="field-label flex flex-col gap-1">
          E-mail
          <input name="email" type="email" required className="field-input" />
        </label>
        <label className="field-label flex flex-col gap-1">
          Senha
          <input
            name="senha"
            type="password"
            required
            className="field-input"
          />
        </label>
        {erro && <p className="text-sm text-red-400">{erro}</p>}
        <button type="submit" disabled={enviando} className="btn-primary mt-2">
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="text-sm text-parchment-dim">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="link-brass">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
