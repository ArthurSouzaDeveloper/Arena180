"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";

type Foto = {
  id: string;
  urlImagem: string;
};

export function PortfolioUpload({ fotosIniciais }: { fotosIniciais: Foto[] }) {
  const [fotos, setFotos] = useState(fotosIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setErro(null);
    setEnviando(true);

    const formData = new FormData();
    formData.append("foto", arquivo);

    const resposta = await fetch("/api/perfil-barbeiro/fotos", {
      method: "POST",
      body: formData,
    });

    setEnviando(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!resposta.ok) {
      const dados = await resposta.json();
      setErro(dados.erro ?? "Não foi possível enviar a foto.");
      return;
    }

    const { foto } = await resposta.json();
    setFotos((atual) => [...atual, foto]);
  }

  async function handleRemover(id: string) {
    setErro(null);
    const resposta = await fetch(`/api/perfil-barbeiro/fotos/${id}`, {
      method: "DELETE",
    });

    if (!resposta.ok) {
      setErro("Não foi possível remover a foto.");
      return;
    }

    setFotos((atual) => atual.filter((foto) => foto.id !== id));
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {fotos.map((foto) => (
          <div key={foto.id} className="group relative aspect-square">
            <Image
              src={foto.urlImagem}
              alt="Foto do portfólio"
              fill
              className="rounded-md object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemover(foto.id)}
              className="absolute right-1 top-1 rounded bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
      <label className="flex w-fit cursor-pointer flex-col gap-1 text-sm">
        <span className="rounded-md border border-neutral-300 px-4 py-2 font-medium">
          {enviando ? "Enviando..." : "Adicionar foto"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={enviando}
          className="hidden"
        />
      </label>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}
