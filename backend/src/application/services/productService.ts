import { prisma } from "../../config/database";
import { NotFoundError } from "../../domain/errors";

interface CreateProductInput {
  quadraId: string;
  name: string;
  price: number;
  photoUrl?: string;
}

interface UpdateProductInput {
  name?: string;
  price?: number;
  photoUrl?: string;
}

async function assertOwnership(id: string, quadraId: string) {
  const product = await prisma.product.findFirst({ where: { id, quadraId } });
  if (!product) {
    throw new NotFoundError("Produto não encontrado");
  }
  return product;
}

export const productService = {
  list(quadraId: string) {
    return prisma.product.findMany({
      where: { quadraId },
      orderBy: { name: "asc" },
    });
  },

  create({ quadraId, name, price, photoUrl }: CreateProductInput) {
    return prisma.product.create({
      data: { quadraId, name, price, photoUrl },
    });
  },

  async update(id: string, quadraId: string, data: UpdateProductInput) {
    await assertOwnership(id, quadraId);
    return prisma.product.update({ where: { id }, data });
  },

  async remove(id: string, quadraId: string) {
    await assertOwnership(id, quadraId);
    await prisma.product.delete({ where: { id } });
  },
};
