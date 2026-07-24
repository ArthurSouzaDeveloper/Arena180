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

export const updateQuadraSettingsSchema = z.object({
  hourlyRate: z.coerce.number().positive('Valor da primeira hora deve ser maior que zero'),
  extraBlockMinutes: z.coerce.number().int().positive('Duração do bloco extra deve ser maior que zero'),
  extraBlockPrice: z.coerce.number().nonnegative('Valor do bloco extra não pode ser negativo'),
});

export const comandaItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

export const createComandaSchema = z.object({
  playerName: z.string().min(1, 'Nome do jogador é obrigatório'),
  items: z.array(comandaItemSchema).default([]),
});

export const updateComandaSchema = z.object({
  playerName: z.string().min(1, 'Nome do jogador é obrigatório').optional(),
  items: z.array(comandaItemSchema).optional(),
});

export const listRachasQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(['ABERTO', 'FECHADO']).optional(),
});
