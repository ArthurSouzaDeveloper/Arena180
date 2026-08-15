"use client";

import { useState } from "react";

export function PagarContratacaoButton({
  contratacaoId,
}: {
  contratacaoId: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handlePagar() {
    setErro(null);
    setEnviando(true);

    const resposta = await fetch(`/api/contratacoes/${contratacaoId}/pagar`, {
      method: "POST",
    });

    if (!resposta.ok) {
      setEnviando(false);
      const dados = await resposta.json();
      setErro(dados.erro ?? "Não foi possível iniciar o pagamento.");
      return;
    }

    const { initPoint } = await resposta.json();
    window.location.href = initPoint;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handlePagar}
        disabled={enviando}
        className="btn-primary py-1.5"
      >
        {enviando ? "Abrindo pagamento..." : "Pagar agora"}
      </button>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  );
}
