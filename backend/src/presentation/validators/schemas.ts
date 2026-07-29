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
  courtId: z.string().uuid('Selecione uma quadra'),
  date: z.coerce.date().optional(),
  durationMinutes: z.coerce.number().int().positive().max(24 * 60).optional(),
  courtPrice: z.coerce.number().positive('Valor da quadra deve ser maior que zero'),
  numberOfPlayers: z.coerce.number().int().positive('Deve haver ao menos 1 jogador').optional(),
  notes: z.string().optional(),
  items: z.array(rachaItemSchema).default([]),
});

export const updateRachaSchema = z.object({
  numberOfPlayers: z.coerce.number().int().positive('Deve haver ao menos 1 jogador').optional(),
  notes: z.string().optional(),
});

export const closeRachaSchema = z.object({
  status: z.enum(['ABERTO', 'FECHADO']),
});

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:mm');

export const updateArenaSettingsSchema = z
  .object({
    bookingOpenTime: timeOfDay,
    bookingCloseTime: timeOfDay,
  })
  .refine((data) => data.bookingOpenTime < data.bookingCloseTime, {
    message: 'O horário de abertura deve ser antes do fechamento',
    path: ['bookingCloseTime'],
  });

const courtPricingFields = {
  name: z.string().min(1, 'Informe o nome da quadra'),
  hourlyRate: z.coerce.number().positive('Valor da primeira hora deve ser maior que zero'),
  extraBlockMinutes: z.coerce.number().int().positive('Duração do bloco extra deve ser maior que zero'),
  extraBlockPrice: z.coerce.number().nonnegative('Valor do bloco extra não pode ser negativo'),
};

export const createCourtSchema = z.object(courtPricingFields);

export const updateCourtSchema = z.object(courtPricingFields).partial().extend({
  active: z.coerce.boolean().optional(),
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

export const createArenaSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  slug: z
    .string()
    .min(2, 'Identificador muito curto')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
  adminName: z.string().min(2, 'Nome do responsável muito curto'),
  adminEmail: z.string().email('E-mail inválido'),
  adminPassword: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
});

export const setArenaActiveSchema = z.object({
  active: z.coerce.boolean(),
});

export const availabilityQuerySchema = z.object({
  courtId: z.string().uuid('Selecione uma quadra'),
  date: z.coerce.date(),
});

export const createBookingSchema = z.object({
  courtId: z.string().uuid('Selecione uma quadra'),
  startsAt: z.coerce.date(),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(30, 'Duração mínima de 30 minutos')
    .max(12 * 60, 'Duração máxima de 12 horas'),
  playerName: z.string().trim().min(2, 'Informe seu nome').max(80),
  playerPhone: z.string().trim().min(8, 'Informe um telefone válido').max(20),
});

export const listRachasQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(['ABERTO', 'FECHADO']).optional(),
  courtId: z.string().uuid().optional(),
});
