-- Introduz as quadras físicas (courts) dentro de cada arena e prepara a Racha
-- para o agendamento público.
--
-- Migração de dados, não só de estrutura: a precificação que hoje vive na arena
-- passa a viver na quadra física, e toda racha existente precisa ser associada a
-- alguma quadra. Por isso é escrita à mão em vez de gerada pelo diff.

-- 1. Nova origem possível para uma racha
CREATE TYPE "RachaSource" AS ENUM ('MANUAL', 'PUBLIC_BOOKING');

-- 2. Janela de funcionamento da arena (usada pelo agendamento público)
ALTER TABLE "arenas" ADD COLUMN "bookingOpenTime" TEXT NOT NULL DEFAULT '08:00';
ALTER TABLE "arenas" ADD COLUMN "bookingCloseTime" TEXT NOT NULL DEFAULT '23:00';

-- 3. Tabela de quadras físicas
CREATE TABLE "courts" (
    "id" TEXT NOT NULL,
    "arenaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL DEFAULT 140,
    "extraBlockMinutes" INTEGER NOT NULL DEFAULT 20,
    "extraBlockPrice" DECIMAL(10,2) NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "courts_arenaId_idx" ON "courts"("arenaId");

ALTER TABLE "courts" ADD CONSTRAINT "courts_arenaId_fkey"
  FOREIGN KEY ("arenaId") REFERENCES "arenas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Cada arena existente ganha uma "Quadra 1" herdando a precificação atual,
--    para nenhuma arena ficar sem quadra e nenhum preço configurado se perder.
INSERT INTO "courts" ("id", "arenaId", "name", "hourlyRate", "extraBlockMinutes", "extraBlockPrice", "active", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  a."id",
  'Quadra 1',
  a."hourlyRate",
  a."extraBlockMinutes",
  a."extraBlockPrice",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "arenas" a;

-- 5. Novos campos da Racha
ALTER TABLE "rachas" ADD COLUMN "courtId" TEXT;
ALTER TABLE "rachas" ADD COLUMN "durationMinutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "rachas" ADD COLUMN "source" "RachaSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "rachas" ADD COLUMN "bookedByName" TEXT;
ALTER TABLE "rachas" ADD COLUMN "bookedByPhone" TEXT;

-- 6. Toda racha existente aponta para a "Quadra 1" da sua própria arena
UPDATE "rachas" r
SET "courtId" = c."id"
FROM "courts" c
WHERE c."arenaId" = r."arenaId";

-- 7. Só depois do backfill o vínculo pode virar obrigatório
ALTER TABLE "rachas" ALTER COLUMN "courtId" SET NOT NULL;

CREATE INDEX "rachas_courtId_date_idx" ON "rachas"("courtId", "date");

ALTER TABLE "rachas" ADD CONSTRAINT "rachas_courtId_fkey"
  FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. Número de jogadores passa a ser preenchido só no fechamento da conta
ALTER TABLE "rachas" ALTER COLUMN "numberOfPlayers" DROP NOT NULL;

-- 9. A precificação agora vive na quadra física, não mais na arena
ALTER TABLE "arenas" DROP COLUMN "hourlyRate";
ALTER TABLE "arenas" DROP COLUMN "extraBlockMinutes";
ALTER TABLE "arenas" DROP COLUMN "extraBlockPrice";
