"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function SolicitarContratacaoForm({
  barbeiroId,
}: {
  barbeiroId: string;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const formData = new FormData(event.currentTarget);
    const resposta = await fetch("/api/contratacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barbeiroId,
        dataInicio: formData.get("dataInicio"),
        dataFim: formData.get("dataFim"),
      }),
    });

    setEnviando(false);

    if (!resposta.ok) {
      const dados = await resposta.json();
      setErro(dados.erro ?? "Não foi possível enviar a solicitação.");
      return;
    }

    setSucesso(true);
    router.push("/contratacoes");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="field-label flex flex-col gap-1">
        Data de início
        <input name="dataInicio" type="date" required className="field-input" />
      </label>
      <label className="field-label flex flex-col gap-1">
        Data de fim
        <input name="dataFim" type="date" required className="field-input" />
      </label>
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      {sucesso && (
        <p className="text-sm text-emerald-400">Solicitação enviada.</p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="btn-primary mt-2 w-fit"
      >
        {enviando ? "Enviando..." : "Solicitar contratação"}
      </button>
    </form>
  );
}
