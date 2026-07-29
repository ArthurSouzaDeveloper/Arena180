import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/http';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import { availabilityQuerySchema, createBookingSchema } from '../validators/schemas';
import { bookingService } from '../../application/services/booking.service';
import { publicBookingLimiter } from '../middlewares/rateLimit.middleware';

// Rotas sem autenticação: qualquer pessoa com o link da arena pode acessar.
// Nenhuma delas expõe dado sensível — só nome da arena, quadras e horários ocupados.
const router = Router();

router.get(
  '/arenas/:slug',
  asyncHandler(async (req, res) => {
    res.json(await bookingService.getPublicArena(req.params.slug));
  }),
);

router.get(
  '/arenas/:slug/availability',
  validateQuery(availabilityQuerySchema),
  asyncHandler(async (req, res) => {
    const { courtId, date } = res.locals.query as z.infer<typeof availabilityQuerySchema>;
    res.json(await bookingService.getAvailability(req.params.slug, courtId, date));
  }),
);

router.post(
  '/arenas/:slug/bookings',
  publicBookingLimiter,
  validateBody(createBookingSchema),
  asyncHandler(async (req, res) => {
    const booking = await bookingService.createBooking(req.params.slug, req.body);
    res.status(201).json(booking);
  }),
);

export default router;
