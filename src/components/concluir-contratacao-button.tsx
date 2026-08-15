"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConcluirContratacaoButton({
  contratacaoId,
}: {
  contratacaoId: string;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleConcluir() {
    setErro(null);
    setEnviando(true);

    const resposta = await fetch(
      `/api/contratacoes/${contratacaoId}/concluir`,
      { method: "POST" },
    );

    setEnviando(false);

    if (!resposta.ok) {
      const dados = await resposta.json();
      setErro(dados.erro ?? "Não foi possível concluir a contratação.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleConcluir}
        disabled={enviando}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {enviando ? "Concluindo..." : "Marcar como concluída"}
      </button>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
