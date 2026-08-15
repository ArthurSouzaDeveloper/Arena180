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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Anos de experiência
        <input
          name="anosExperiencia"
          type="number"
          min={0}
          required
          defaultValue={valoresIniciais?.anosExperiencia}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Especialidades (separadas por vírgula)
        <input
          name="especialidades"
          required
          placeholder="degradê, barba, corte infantil"
          defaultValue={valoresIniciais?.especialidades.join(", ")}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Cidade
        <input
          name="cidade"
          required
          defaultValue={valoresIniciais?.cidade}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Bairro (opcional)
        <input
          name="bairro"
          defaultValue={valoresIniciais?.bairro}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Raio de atendimento (km)
        <input
          name="raioAtendimentoKm"
          type="number"
          min={1}
          required
          defaultValue={valoresIniciais?.raioAtendimentoKm}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Valor padrão da diária (R$)
        <input
          name="valorDiariaPadrao"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={valoresIniciais?.valorDiariaPadrao}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </label>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {sucesso && (
        <p className="text-sm text-green-700">Perfil salvo com sucesso.</p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="mt-2 w-fit rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
}
