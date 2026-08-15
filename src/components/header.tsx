"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
      <Link href="/" className="font-semibold">
        Arena180
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/barbeiros">Buscar barbeiros</Link>
        {session?.user.tipo === "BARBEIRO" && (
          <Link href="/perfil">Meu perfil</Link>
        )}
        {session ? (
          <button onClick={() => signOut()} className="underline">
            Sair
          </button>
        ) : (
          <Link href="/login">Entrar</Link>
        )}
      </nav>
    </header>
  );
}
