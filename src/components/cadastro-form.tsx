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
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <label className="field-label flex flex-col gap-1">
        Nome
        <input name="nome" required className="field-input" />
      </label>
      <label className="field-label flex flex-col gap-1">
        E-mail
        <input name="email" type="email" required className="field-input" />
      </label>
      <label className="field-label flex flex-col gap-1">
        Telefone
        <input name="telefone" className="field-input" />
      </label>
      {camposExtras.map((campo) => (
        <label key={campo.name} className="field-label flex flex-col gap-1">
          {campo.label}
          <input
            name={campo.name}
            required={campo.required}
            className="field-input"
          />
        </label>
      ))}
      <label className="field-label flex flex-col gap-1">
        Senha
        <input
          name="senha"
          type="password"
          required
          minLength={8}
          className="field-input"
        />
      </label>
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      <button type="submit" disabled={enviando} className="btn-primary mt-2">
        {enviando ? "Enviando..." : "Criar conta"}
      </button>
    </form>
  );
}
