"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AvaliarContratacaoForm({
  contratacaoId,
}: {
  contratacaoId: string;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const formData = new FormData(event.currentTarget);
    const resposta = await fetch(`/api/contratacoes/${contratacaoId}/avaliar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nota: formData.get("nota"),
        comentario: formData.get("comentario") || undefined,
      }),
    });

    setEnviando(false);

    if (!resposta.ok) {
      const dados = await resposta.json();
      setErro(dados.erro ?? "Não foi possível enviar a avaliação.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 text-sm">
      <label className="field-label flex flex-col gap-1">
        Nota (1 a 5)
        <select name="nota" required defaultValue="" className="field-input">
          <option value="" disabled>
            Selecione
          </option>
          {[1, 2, 3, 4, 5].map((nota) => (
            <option key={nota} value={nota}>
              {nota}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label flex flex-col gap-1">
        Comentário (opcional)
        <textarea name="comentario" rows={2} className="field-input" />
      </label>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="btn-primary w-fit py-1.5"
      >
        {enviando ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
