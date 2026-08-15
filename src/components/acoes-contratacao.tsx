"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcoesContratacao({ contratacaoId }: { contratacaoId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState<"aceitar" | "recusar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleAcao(acao: "aceitar" | "recusar") {
    setErro(null);
    setEnviando(acao);

    const resposta = await fetch(`/api/contratacoes/${contratacaoId}/${acao}`, {
      method: "POST",
    });

    setEnviando(null);

    if (!resposta.ok) {
      const dados = await resposta.json();
      setErro(dados.erro ?? "Não foi possível concluir a ação.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleAcao("aceitar")}
          disabled={enviando !== null}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {enviando === "aceitar" ? "Aceitando..." : "Aceitar"}
        </button>
        <button
          type="button"
          onClick={() => handleAcao("recusar")}
          disabled={enviando !== null}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {enviando === "recusar" ? "Recusando..." : "Recusar"}
        </button>
      </div>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
