import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarHashSenha } from "@/lib/senha";
import {
  cadastroBarbeariaSchema,
  cadastroBarbeiroSchema,
} from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json();
  const tipo = body?.tipo;

  if (tipo !== "BARBEARIA" && tipo !== "BARBEIRO") {
    return NextResponse.json(
      { erro: "Tipo de cadastro inválido." },
      { status: 400 },
    );
  }

  const schema =
    tipo === "BARBEARIA" ? cadastroBarbeariaSchema : cadastroBarbeiroSchema;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const emailExistente = await prisma.usuario.findUnique({
    where: { email: parsed.data.email },
  });
  if (emailExistente) {
    return NextResponse.json(
      { erro: "Já existe uma conta com esse e-mail." },
      { status: 409 },
    );
  }

  const senhaHash = await gerarHashSenha(parsed.data.senha);

  const usuario = await prisma.usuario.create({
    data: {
      tipo,
      nome: parsed.data.nome,
      email: parsed.data.email,
      telefone: parsed.data.telefone,
      senhaHash,
      ...(tipo === "BARBEARIA"
        ? {
            cnpj: (parsed.data as { cnpj?: string }).cnpj,
            endereco: (parsed.data as { endereco: string }).endereco,
          }
        : {
            cpf: (parsed.data as { cpf: string }).cpf,
          }),
    },
    select: { id: true, nome: true, email: true, tipo: true },
  });

  return NextResponse.json({ usuario }, { status: 201 });
}
