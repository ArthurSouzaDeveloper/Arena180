-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('BARBEARIA', 'BARBEIRO');

-- CreateEnum
CREATE TYPE "StatusContratacao" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA', 'EXPIRADA', 'PAGA', 'CONCLUIDA', 'AVALIADA');

-- CreateEnum
CREATE TYPE "StatusSplit" AS ENUM ('PENDENTE', 'PROCESSADO', 'FALHOU');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf" TEXT,
    "cnpj" TEXT,
    "endereco" TEXT,
    "senha_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfis_barbeiro" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "anos_experiencia" INTEGER NOT NULL,
    "especialidades" TEXT[],
    "cidade" TEXT NOT NULL,
    "bairro" TEXT,
    "raio_atendimento_km" INTEGER NOT NULL,
    "valor_diaria_padrao" DECIMAL(10,2) NOT NULL,
    "mp_account_id" TEXT,
    "mp_access_token" TEXT,
    "mp_refresh_token" TEXT,
    "mp_token_expira_em" TIMESTAMP(3),
    "nota_media" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "total_avaliacoes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "perfis_barbeiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_fotos" (
    "id" TEXT NOT NULL,
    "perfil_barbeiro_id" TEXT NOT NULL,
    "url_imagem" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "portfolio_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratacoes" (
    "id" TEXT NOT NULL,
    "barbearia_id" TEXT NOT NULL,
    "barbeiro_id" TEXT NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_fim" TIMESTAMP(3) NOT NULL,
    "valor_barbeiro" DECIMAL(10,2) NOT NULL,
    "valor_comissao" DECIMAL(10,2) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "status" "StatusContratacao" NOT NULL DEFAULT 'PENDENTE',
    "expira_em" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contratacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "contratacao_id" TEXT NOT NULL,
    "mp_preference_id" TEXT,
    "mp_payment_id" TEXT,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "valor_repassado_barbeiro" DECIMAL(10,2) NOT NULL,
    "valor_comissao_plataforma" DECIMAL(10,2) NOT NULL,
    "status_split" "StatusSplit" NOT NULL DEFAULT 'PENDENTE',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "contratacao_id" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversas" (
    "id" TEXT NOT NULL,
    "contratacao_id" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" TEXT NOT NULL,
    "conversa_id" TEXT NOT NULL,
    "remetente_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "perfis_barbeiro_usuario_id_key" ON "perfis_barbeiro"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_contratacao_id_key" ON "pagamentos"("contratacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_contratacao_id_key" ON "avaliacoes"("contratacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversas_contratacao_id_key" ON "conversas"("contratacao_id");

-- AddForeignKey
ALTER TABLE "perfis_barbeiro" ADD CONSTRAINT "perfis_barbeiro_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_fotos" ADD CONSTRAINT "portfolio_fotos_perfil_barbeiro_id_fkey" FOREIGN KEY ("perfil_barbeiro_id") REFERENCES "perfis_barbeiro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratacoes" ADD CONSTRAINT "contratacoes_barbearia_id_fkey" FOREIGN KEY ("barbearia_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratacoes" ADD CONSTRAINT "contratacoes_barbeiro_id_fkey" FOREIGN KEY ("barbeiro_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_contratacao_id_fkey" FOREIGN KEY ("contratacao_id") REFERENCES "contratacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_contratacao_id_fkey" FOREIGN KEY ("contratacao_id") REFERENCES "contratacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_contratacao_id_fkey" FOREIGN KEY ("contratacao_id") REFERENCES "contratacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversa_id_fkey" FOREIGN KEY ("conversa_id") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_remetente_id_fkey" FOREIGN KEY ("remetente_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

