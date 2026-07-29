-- Renomeia o tenant "Quadra" para "Arena", liberando a palavra "quadra" para as
-- quadras físicas (Quadra 1, 2, 3...) introduzidas na migration seguinte.
--
-- Escrita à mão com RENAME em vez de DROP/CREATE: o diff automático do Prisma
-- recriaria as tabelas do zero e apagaria os dados já existentes em produção.

-- Tabela do tenant
ALTER TABLE "quadras" RENAME TO "arenas";
ALTER TABLE "arenas" RENAME CONSTRAINT "quadras_pkey" TO "arenas_pkey";
ALTER INDEX "quadras_slug_key" RENAME TO "arenas_slug_key";

-- users.quadraId -> users.arenaId
ALTER TABLE "users" RENAME COLUMN "quadraId" TO "arenaId";
ALTER TABLE "users" RENAME CONSTRAINT "users_quadraId_fkey" TO "users_arenaId_fkey";
ALTER INDEX "users_quadraId_idx" RENAME TO "users_arenaId_idx";

-- products.quadraId -> products.arenaId
ALTER TABLE "products" RENAME COLUMN "quadraId" TO "arenaId";
ALTER TABLE "products" RENAME CONSTRAINT "products_quadraId_fkey" TO "products_arenaId_fkey";
ALTER INDEX "products_quadraId_idx" RENAME TO "products_arenaId_idx";

-- rachas.quadraId -> rachas.arenaId
ALTER TABLE "rachas" RENAME COLUMN "quadraId" TO "arenaId";
ALTER TABLE "rachas" RENAME CONSTRAINT "rachas_quadraId_fkey" TO "rachas_arenaId_fkey";
ALTER INDEX "rachas_quadraId_date_idx" RENAME TO "rachas_arenaId_date_idx";
