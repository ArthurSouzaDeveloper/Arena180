-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('BEBIDA', 'COMIDA');

-- CreateEnum
CREATE TYPE "RachaStatus" AS ENUM ('ABERTO', 'FECHADO');

-- CreateTable
CREATE TABLE "quadras" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerName" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL DEFAULT 140,
    "extraBlockMinutes" INTEGER NOT NULL DEFAULT 20,
    "extraBlockPrice" DECIMAL(10,2) NOT NULL DEFAULT 30,

    CONSTRAINT "quadras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "quadraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "quadraId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "photoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rachas" (
    "id" TEXT NOT NULL,
    "quadraId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courtPrice" DECIMAL(10,2) NOT NULL,
    "numberOfPlayers" INTEGER NOT NULL,
    "status" "RachaStatus" NOT NULL DEFAULT 'ABERTO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rachas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "racha_items" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "racha_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quadras_slug_key" ON "quadras"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_quadraId_idx" ON "users"("quadraId");

-- CreateIndex
CREATE INDEX "products_quadraId_idx" ON "products"("quadraId");

-- CreateIndex
CREATE INDEX "rachas_quadraId_date_idx" ON "rachas"("quadraId", "date");

-- CreateIndex
CREATE INDEX "racha_items_rachaId_idx" ON "racha_items"("rachaId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_quadraId_fkey" FOREIGN KEY ("quadraId") REFERENCES "quadras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_quadraId_fkey" FOREIGN KEY ("quadraId") REFERENCES "quadras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rachas" ADD CONSTRAINT "rachas_quadraId_fkey" FOREIGN KEY ("quadraId") REFERENCES "quadras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "racha_items" ADD CONSTRAINT "racha_items_rachaId_fkey" FOREIGN KEY ("rachaId") REFERENCES "rachas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "racha_items" ADD CONSTRAINT "racha_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

