import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const senhaHash = await bcrypt.hash("senha12345", 10);

  const barbearia = await prisma.usuario.create({
    data: {
      tipo: "BARBEARIA",
      nome: "Barbearia Vintage & Navalha",
      email: "contato@vintagenavalha.com",
      telefone: "11999990000",
      endereco: "Rua Augusta, 1200 - São Paulo/SP",
      senhaHash,
    },
  });

  const barbeiro1 = await prisma.usuario.create({
    data: {
      tipo: "BARBEIRO",
      nome: "Marcos Ferreira",
      email: "marcos@email.com",
      telefone: "11988887777",
      cpf: "11122233344",
      senhaHash,
    },
  });

  const perfil1 = await prisma.perfilBarbeiro.create({
    data: {
      usuarioId: barbeiro1.id,
      anosExperiencia: 8,
      especialidades: ["degradê", "barba", "navalha"],
      cidade: "São Paulo",
      bairro: "Vila Madalena",
      raioAtendimentoKm: 15,
      valorDiariaPadrao: 250,
      mpAccountId: "123456789",
      notaMedia: 4.8,
      totalAvaliacoes: 12,
    },
  });

  await prisma.portfolioFoto.createMany({
    data: [
      {
        perfilBarbeiroId: perfil1.id,
        urlImagem: "/uploads/portfolio/seed1.png",
        ordem: 0,
      },
      {
        perfilBarbeiroId: perfil1.id,
        urlImagem: "/uploads/portfolio/seed2.png",
        ordem: 1,
      },
      {
        perfilBarbeiroId: perfil1.id,
        urlImagem: "/uploads/portfolio/seed3.png",
        ordem: 2,
      },
    ],
  });

  const barbeiro2 = await prisma.usuario.create({
    data: {
      tipo: "BARBEIRO",
      nome: "Rafael Souza",
      email: "rafael@email.com",
      telefone: "11977776666",
      cpf: "22233344455",
      senhaHash,
    },
  });

  const perfil2 = await prisma.perfilBarbeiro.create({
    data: {
      usuarioId: barbeiro2.id,
      anosExperiencia: 4,
      especialidades: ["corte infantil", "sobrancelha"],
      cidade: "São Paulo",
      bairro: "Pinheiros",
      raioAtendimentoKm: 10,
      valorDiariaPadrao: 180,
      mpAccountId: "987654321",
      notaMedia: 4.5,
      totalAvaliacoes: 6,
    },
  });

  await prisma.portfolioFoto.create({
    data: {
      perfilBarbeiroId: perfil2.id,
      urlImagem: "/uploads/portfolio/seed4.png",
      ordem: 0,
    },
  });

  const barbeiro3 = await prisma.usuario.create({
    data: {
      tipo: "BARBEIRO",
      nome: "Diego Almeida",
      email: "diego@email.com",
      telefone: "11966665555",
      cpf: "33344455566",
      senhaHash,
    },
  });

  await prisma.perfilBarbeiro.create({
    data: {
      usuarioId: barbeiro3.id,
      anosExperiencia: 2,
      especialidades: ["degradê", "risco"],
      cidade: "Campinas",
      bairro: "Centro",
      raioAtendimentoKm: 20,
      valorDiariaPadrao: 150,
      notaMedia: 0,
      totalAvaliacoes: 0,
    },
  });

  const agora = new Date();
  const daqui3dias = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);
  const daqui4dias = new Date(agora.getTime() + 4 * 24 * 60 * 60 * 1000);
  const ha5dias = new Date(agora.getTime() - 5 * 24 * 60 * 60 * 1000);
  const ha4dias = new Date(agora.getTime() - 4 * 24 * 60 * 60 * 1000);
  const ha10dias = new Date(agora.getTime() - 10 * 24 * 60 * 60 * 1000);
  const ha9dias = new Date(agora.getTime() - 9 * 24 * 60 * 60 * 1000);
  const ha20dias = new Date(agora.getTime() - 20 * 24 * 60 * 60 * 1000);
  const ha19dias = new Date(agora.getTime() - 19 * 24 * 60 * 60 * 1000);

  // Pedido pendente (aguardando resposta do barbeiro)
  await prisma.contratacao.create({
    data: {
      barbeariaId: barbearia.id,
      barbeiroId: barbeiro3.id,
      dataInicio: daqui3dias,
      dataFim: daqui4dias,
      valorBarbeiro: 150,
      valorComissao: 18,
      valorTotal: 168,
      status: "PENDENTE",
      expiraEm: new Date(agora.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  // Contratação aceita, pronta para pagamento
  await prisma.contratacao.create({
    data: {
      barbeariaId: barbearia.id,
      barbeiroId: barbeiro2.id,
      dataInicio: daqui3dias,
      dataFim: daqui4dias,
      valorBarbeiro: 180,
      valorComissao: 21.6,
      valorTotal: 201.6,
      status: "ACEITA",
      expiraEm: new Date(agora.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  // Contratação paga (libera chat), com conversa e mensagens
  const contratacaoPaga = await prisma.contratacao.create({
    data: {
      barbeariaId: barbearia.id,
      barbeiroId: barbeiro1.id,
      dataInicio: ha4dias,
      dataFim: ha4dias,
      valorBarbeiro: 250,
      valorComissao: 30,
      valorTotal: 280,
      status: "PAGA",
      expiraEm: ha5dias,
    },
  });

  await prisma.pagamento.create({
    data: {
      contratacaoId: contratacaoPaga.id,
      mpPaymentId: "1234567890",
      valorTotal: 280,
      valorRepassadoBarbeiro: 250,
      valorComissaoPlataforma: 30,
      statusSplit: "PROCESSADO",
    },
  });

  const conversa = await prisma.conversa.create({
    data: { contratacaoId: contratacaoPaga.id },
  });

  await prisma.mensagem.createMany({
    data: [
      {
        conversaId: conversa.id,
        remetenteId: barbearia.id,
        texto: "Oi Marcos! Pode chegar às 9h no sábado?",
      },
      {
        conversaId: conversa.id,
        remetenteId: barbeiro1.id,
        texto: "Perfeito, chego às 9h. Levo minhas próprias navalhas.",
      },
      {
        conversaId: conversa.id,
        remetenteId: barbearia.id,
        texto: "Combinado! Endereço é Rua Augusta, 1200.",
      },
    ],
  });

  // Contratação concluída, aguardando avaliação
  await prisma.contratacao.create({
    data: {
      barbeariaId: barbearia.id,
      barbeiroId: barbeiro2.id,
      dataInicio: ha10dias,
      dataFim: ha9dias,
      valorBarbeiro: 180,
      valorComissao: 21.6,
      valorTotal: 201.6,
      status: "CONCLUIDA",
      expiraEm: ha10dias,
    },
  });

  // Contratação avaliada (ciclo completo)
  const contratacaoAvaliada = await prisma.contratacao.create({
    data: {
      barbeariaId: barbearia.id,
      barbeiroId: barbeiro1.id,
      dataInicio: ha20dias,
      dataFim: ha19dias,
      valorBarbeiro: 250,
      valorComissao: 30,
      valorTotal: 280,
      status: "AVALIADA",
      expiraEm: ha20dias,
    },
  });

  await prisma.avaliacao.create({
    data: {
      contratacaoId: contratacaoAvaliada.id,
      nota: 5,
      comentario: "Excelente profissional, super pontual e caprichoso!",
    },
  });

  console.log("Seed concluído.");
  console.log("Login barbearia: contato@vintagenavalha.com / senha12345");
  console.log("Login barbeiro:  marcos@email.com / senha12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
