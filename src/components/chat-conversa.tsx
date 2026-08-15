"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { io, type Socket } from "socket.io-client";

type Mensagem = {
  id: string;
  texto: string;
  criadoEm: string;
  remetenteId: string;
  remetenteNome: string;
};

export function ChatConversa({
  conversaId,
  usuarioId,
  mensagensIniciais,
}: {
  conversaId: string;
  usuarioId: string;
  mensagensIniciais: Mensagem[];
}) {
  const [mensagens, setMensagens] = useState(mensagensIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;

    socket.emit("conversa:entrar", conversaId);

    socket.on(
      "mensagem:nova",
      (mensagem: Mensagem & { conversaId?: string }) => {
        setMensagens((atual) => [...atual, mensagem]);
      },
    );

    socket.on("conversa:erro", (mensagemErro: string) => {
      setErro(mensagemErro);
    });

    return () => {
      socket.disconnect();
    };
  }, [conversaId]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const texto = String(formData.get("texto") ?? "").trim();
    if (!texto || !socketRef.current) return;

    socketRef.current.emit("mensagem:enviar", { conversaId, texto });
    event.currentTarget.reset();
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="card flex max-h-[60vh] min-h-[300px] flex-col gap-2 overflow-y-auto p-4">
        {mensagens.map((mensagem) => (
          <div
            key={mensagem.id}
            className={`max-w-[75%] rounded-sm px-3 py-2 text-sm ${
              mensagem.remetenteId === usuarioId
                ? "ml-auto bg-brass text-ink"
                : "bg-ink-raised-2 text-parchment"
            }`}
          >
            <p className="text-xs opacity-70">{mensagem.remetenteNome}</p>
            <p>{mensagem.texto}</p>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      {erro && <p className="text-sm text-red-400">{erro}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          name="texto"
          placeholder="Escreva uma mensagem..."
          maxLength={1000}
          required
          className="field-input flex-1"
        />
        <button type="submit" className="btn-primary">
          Enviar
        </button>
      </form>
    </div>
  );
}
