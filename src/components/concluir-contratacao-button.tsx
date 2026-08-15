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
        className="btn-secondary py-1.5"
      >
        {enviando ? "Concluindo..." : "Marcar como concluída"}
      </button>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  );
}
