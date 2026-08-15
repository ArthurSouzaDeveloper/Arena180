import { unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEIRO") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const foto = await prisma.portfolioFoto.findUnique({
    where: { id },
    include: { perfilBarbeiro: true },
  });

  if (!foto || foto.perfilBarbeiro.usuarioId !== session.user.id) {
    return NextResponse.json({ erro: "Foto não encontrada." }, { status: 404 });
  }

  await prisma.portfolioFoto.delete({ where: { id } });

  try {
    await unlink(path.join(process.cwd(), "public", foto.urlImagem));
  } catch {
    // arquivo pode já não existir em disco; a remoção do registro é o que importa
  }

  return NextResponse.json({ ok: true });
}
