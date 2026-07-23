import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  category: z.enum(['BEBIDA', 'COMIDA']),
  price: z.coerce.number().positive('Preço deve ser maior que zero'),
});

export const updateProductSchema = createProductSchema.partial().extend({
  active: z.coerce.boolean().optional(),
});

export const rachaItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

export const createRachaSchema = z.object({
  date: z.coerce.date().optional(),
  courtPrice: z.coerce.number().positive('Valor da quadra deve ser maior que zero'),
  numberOfPlayers: z.coerce.number().int().positive('Deve haver ao menos 1 jogador'),
  notes: z.string().optional(),
  items: z.array(rachaItemSchema).default([]),
});

export const closeRachaSchema = z.object({
  status: z.enum(['ABERTO', 'FECHADO']),
});
