import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gerarUrlAutorizacaoOAuth } from "@/lib/mercadopago";

export async function GET() {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEIRO") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const url = gerarUrlAutorizacaoOAuth(session.user.id);
  return NextResponse.redirect(url);
}
