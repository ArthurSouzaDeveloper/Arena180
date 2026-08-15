import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { perfilBarbeiroSchema } from "@/lib/validation";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEIRO") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = perfilBarbeiroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const perfil = await prisma.perfilBarbeiro.upsert({
    where: { usuarioId: session.user.id },
    update: parsed.data,
    create: { usuarioId: session.user.id, ...parsed.data },
  });

  return NextResponse.json({ perfil });
}
