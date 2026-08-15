"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-line">
      <div className="pole-stripe h-[3px]" />
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-parchment"
        >
          FreeBarber
        </Link>
        <nav className="flex items-center gap-5 text-sm text-parchment-dim">
          <Link href="/barbeiros" className="hover:text-brass">
            Buscar barbeiros
          </Link>
          {session?.user.tipo === "BARBEIRO" && (
            <>
              <Link href="/perfil" className="hover:text-brass">
                Meu perfil
              </Link>
              <Link href="/pedidos" className="hover:text-brass">
                Pedidos
              </Link>
            </>
          )}
          {session?.user.tipo === "BARBEARIA" && (
            <Link href="/contratacoes" className="hover:text-brass">
              Minhas contratações
            </Link>
          )}
          {session ? (
            <button onClick={() => signOut()} className="hover:text-brass">
              Sair
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-sm border border-line px-3 py-1.5 hover:border-brass hover:text-brass"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
