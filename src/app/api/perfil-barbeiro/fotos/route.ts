import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;
const PASTA_UPLOADS = path.join(
  process.cwd(),
  "public",
  "uploads",
  "portfolio",
);

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.tipo !== "BARBEIRO") {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const perfil = await prisma.perfilBarbeiro.findUnique({
    where: { usuarioId: session.user.id },
  });
  if (!perfil) {
    return NextResponse.json(
      { erro: "Salve seu perfil antes de enviar fotos." },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const arquivo = formData.get("foto");

  if (!(arquivo instanceof File)) {
    return NextResponse.json(
      { erro: "Envie um arquivo de imagem." },
      { status: 400 },
    );
  }
  if (!arquivo.type.startsWith("image/")) {
    return NextResponse.json(
      { erro: "O arquivo precisa ser uma imagem." },
      { status: 400 },
    );
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return NextResponse.json(
      { erro: "Imagem maior que 5MB." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await arquivo.arrayBuffer());
  const extensao = path.extname(arquivo.name) || ".jpg";
  const nomeArquivo = `${randomUUID()}${extensao}`;

  await mkdir(PASTA_UPLOADS, { recursive: true });
  await writeFile(path.join(PASTA_UPLOADS, nomeArquivo), bytes);

  const totalFotos = await prisma.portfolioFoto.count({
    where: { perfilBarbeiroId: perfil.id },
  });

  const foto = await prisma.portfolioFoto.create({
    data: {
      perfilBarbeiroId: perfil.id,
      urlImagem: `/uploads/portfolio/${nomeArquivo}`,
      ordem: totalFotos,
    },
  });

  return NextResponse.json({ foto }, { status: 201 });
}
