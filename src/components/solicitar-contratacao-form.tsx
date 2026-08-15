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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Data de início
        <input
          name="dataInicio"
          type="date"
          required
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Data de fim
        <input
          name="dataFim"
          type="date"
          required
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {sucesso && (
        <p className="text-sm text-green-700">Solicitação enviada.</p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="mt-2 w-fit rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Solicitar contratação"}
      </button>
    </form>
  );
}
