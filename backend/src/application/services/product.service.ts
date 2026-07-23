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
  async list(quadraId: string, includeInactive = false) {
    return prisma.product.findMany({
      where: { quadraId, ...(includeInactive ? {} : { active: true }) },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  },

  async create(quadraId: string, input: CreateProductInput) {
    return prisma.product.create({
      data: {
        quadraId,
        name: input.name,
        category: input.category,
        price: input.price,
        photoUrl: input.photoUrl,
      },
    });
  },

  async update(quadraId: string, productId: string, input: UpdateProductInput) {
    const existing = await prisma.product.findFirst({ where: { id: productId, quadraId } });
    if (!existing) throw new NotFoundError('Produto');

    return prisma.product.update({
      where: { id: productId },
      data: input,
    });
  },

  async remove(quadraId: string, productId: string) {
    const existing = await prisma.product.findFirst({ where: { id: productId, quadraId } });
    if (!existing) throw new NotFoundError('Produto');

    // Soft delete: produtos já usados em rachas fechadas não podem sumir do histórico.
    await prisma.product.update({ where: { id: productId }, data: { active: false } });
  },
};
