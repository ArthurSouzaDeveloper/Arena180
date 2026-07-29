-- CreateTable
CREATE TABLE "comandas" (
    "id" TEXT NOT NULL,
    "rachaId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comanda_items" (
    "id" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comanda_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comandas_rachaId_idx" ON "comandas"("rachaId");

-- CreateIndex
CREATE INDEX "comanda_items_comandaId_idx" ON "comanda_items"("comandaId");

-- AddForeignKey
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_rachaId_fkey" FOREIGN KEY ("rachaId") REFERENCES "rachas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comanda_items" ADD CONSTRAINT "comanda_items_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comanda_items" ADD CONSTRAINT "comanda_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

