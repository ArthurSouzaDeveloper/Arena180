import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { trocarCodigoPorToken } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (
    !session ||
    session.user.tipo !== "BARBEIRO" ||
    !code ||
    state !== session.user.id
  ) {
    return NextResponse.redirect(new URL("/perfil?mp=erro", request.url));
  }

  try {
    const token = await trocarCodigoPorToken(code);

    await prisma.perfilBarbeiro.update({
      where: { usuarioId: session.user.id },
      data: {
        mpAccountId: String(token.user_id),
        mpAccessToken: token.access_token,
        mpRefreshToken: token.refresh_token,
        mpTokenExpiraEm: new Date(Date.now() + token.expires_in * 1000),
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/perfil?mp=erro", request.url));
  }

  return NextResponse.redirect(new URL("/perfil?mp=sucesso", request.url));
}
