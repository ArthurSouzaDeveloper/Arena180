"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type CampoExtra = {
  name: string;
  label: string;
  required?: boolean;
};

export function CadastroForm({
  tipo,
  camposExtras,
}: {
  tipo: "BARBEARIA" | "BARBEIRO";
  camposExtras: CampoExtra[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const formData = new FormData(event.currentTarget);
    const body = { tipo, ...Object.fromEntries(formData.entries()) };

    const resposta = await fetch("/api/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setEnviando(false);

    if (!resposta.ok) {
      const dados = await resposta.json();
      setErro(dados.erro ?? "Não foi possível concluir o cadastro.");
      return;
    }

    router.push("/login");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-3"
    >
      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input
          name="nome"
          required
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
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
        Telefone
        <input
          name="telefone"
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      {camposExtras.map((campo) => (
        <label key={campo.name} className="flex flex-col gap-1 text-sm">
          {campo.label}
          <input
            name={campo.name}
            required={campo.required}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>
      ))}
      <label className="flex flex-col gap-1 text-sm">
        Senha
        <input
          name="senha"
          type="password"
          required
          minLength={8}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="mt-2 rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Criar conta"}
      </button>
    </form>
  );
}
