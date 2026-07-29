import { ProductCategory } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';

interface CreateProductInput {
  name: string;
  category: ProductCategory;
  price: number;
  photoUrl?: string;
}

interface UpdateProductInput {
  name?: string;
  category?: ProductCategory;
  price?: number;
  active?: boolean;
  photoUrl?: string;
}

export const productService = {
  async list(arenaId: string, includeInactive = false) {
    return prisma.product.findMany({
      where: { arenaId, ...(includeInactive ? {} : { active: true }) },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  },

  async create(arenaId: string, input: CreateProductInput) {
    return prisma.product.create({
      data: {
        arenaId,
        name: input.name,
        category: input.category,
        price: input.price,
        photoUrl: input.photoUrl,
      },
    });
  },

  async update(arenaId: string, productId: string, input: UpdateProductInput) {
    const existing = await prisma.product.findFirst({ where: { id: productId, arenaId } });
    if (!existing) throw new NotFoundError('Produto');

    return prisma.product.update({
      where: { id: productId },
      data: input,
    });
  },

  async remove(arenaId: string, productId: string) {
    const existing = await prisma.product.findFirst({ where: { id: productId, arenaId } });
    if (!existing) throw new NotFoundError('Produto');

    // Soft delete: produtos já usados em rachas fechadas não podem sumir do histórico.
    await prisma.product.update({ where: { id: productId }, data: { active: false } });
  },
};
