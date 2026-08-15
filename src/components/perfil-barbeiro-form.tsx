"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ValoresPerfil = {
  anosExperiencia: number;
  especialidades: string[];
  cidade: string;
  bairro: string;
  raioAtendimentoKm: number;
  valorDiariaPadrao: number;
};

export function PerfilBarbeiroForm({
  valoresIniciais,
}: {
  valoresIniciais: ValoresPerfil | null;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setSucesso(false);
    setEnviando(true);

    const formData = new FormData(event.currentTarget);
    const especialidades = String(formData.get("especialidades") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const body = {
      anosExperiencia: formData.get("anosExperiencia"),
      especialidades,
      cidade: formData.get("cidade"),
      bairro: formData.get("bairro") || undefined,
      raioAtendimentoKm: formData.get("raioAtendimentoKm"),
      valorDiariaPadrao: formData.get("valorDiariaPadrao"),
    };

    const resposta = await fetch("/api/perfil-barbeiro", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setEnviando(false);

    if (!resposta.ok) {
      const dados = await resposta.json();
      setErro(dados.erro ?? "Não foi possível salvar o perfil.");
      return;
    }

    setSucesso(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="field-label flex flex-col gap-1">
        Anos de experiência
        <input
          name="anosExperiencia"
          type="number"
          min={0}
          required
          defaultValue={valoresIniciais?.anosExperiencia}
          className="field-input"
        />
      </label>
      <label className="field-label flex flex-col gap-1">
        Especialidades (separadas por vírgula)
        <input
          name="especialidades"
          required
          placeholder="degradê, barba, corte infantil"
          defaultValue={valoresIniciais?.especialidades.join(", ")}
          className="field-input"
        />
      </label>
      <label className="field-label flex flex-col gap-1">
        Cidade
        <input
          name="cidade"
          required
          defaultValue={valoresIniciais?.cidade}
          className="field-input"
        />
      </label>
      <label className="field-label flex flex-col gap-1">
        Bairro (opcional)
        <input
          name="bairro"
          defaultValue={valoresIniciais?.bairro}
          className="field-input"
        />
      </label>
      <label className="field-label flex flex-col gap-1">
        Raio de atendimento (km)
        <input
          name="raioAtendimentoKm"
          type="number"
          min={1}
          required
          defaultValue={valoresIniciais?.raioAtendimentoKm}
          className="field-input"
        />
      </label>
      <label className="field-label flex flex-col gap-1">
        Valor padrão da diária (R$)
        <input
          name="valorDiariaPadrao"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={valoresIniciais?.valorDiariaPadrao}
          className="field-input"
        />
      </label>
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      {sucesso && (
        <p className="text-sm text-emerald-400">Perfil salvo com sucesso.</p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="btn-primary mt-2 w-fit"
      >
        {enviando ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
}
